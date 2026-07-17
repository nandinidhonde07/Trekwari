import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

interface OpenWeatherCurrent {
  weather: Array<{
    id: number;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
  };
  rain?: {
    [key: string]: number;
  };
}

interface OpenWeatherForecastItem {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
  };
  wind: {
    speed: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
}

interface OpenWeatherForecast {
  list: OpenWeatherForecastItem[];
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Memory cache for weather requests
const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Gets live weather reports for a trek using its ID or slug coordinates.
 */
export async function getTrekWeather(req: Request, res: Response) {
  const { eventId, slug, location } = req.query;

  let lat = 19.6012; // Bari Base defaults (Kalsubai)
  let lon = 73.7176;
  let trekLocationName = 'Bari, Bhandardara';

  // 1. Resolve coordinates from database if eventId or slug is supplied
  if (eventId || slug) {
    try {
      const event = await prisma.event.findFirst({
        where: {
          OR: [
            eventId ? { id: String(eventId) } : {},
            slug ? { slug: String(slug) } : {}
          ].filter(o => Object.keys(o).length > 0)
        }
      });

      if (event && event.latitude && event.longitude) {
        lat = event.latitude;
        lon = event.longitude;
        trekLocationName = event.location;
      }
    } catch (dbError) {
      console.error('Failed to look up event coordinates:', dbError);
    }
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  const isMock = !apiKey || apiKey.includes('your_openweathermap_api_key') || apiKey.startsWith('mock');

  if (isMock) {
    // Generate beautiful monsoon or dry Sahyadri simulated data based on current season
    const isMonsoon = new Date().getMonth() >= 5 && new Date().getMonth() <= 9; // June to Oct
    const mockData = {
      source: 'SIMULATED_SAHYADRI_FEED',
      location: trekLocationName,
      temp: isMonsoon ? '21°C' : '28°C',
      feelsLike: isMonsoon ? '20°C' : '30°C',
      windSpeed: isMonsoon ? '24 km/h' : '8 km/h',
      conditions: isMonsoon ? 'Heavy Monsoon Showers & Dense Fog' : 'Clear Sunny Sky',
      humidity: isMonsoon ? '95%' : '55%',
      rainProbability: isMonsoon ? '90%' : '5%',
      sunrise: '06:05 AM',
      sunset: '07:12 PM',
      icon: isMonsoon ? '09d' : '01d',
      alerts: isMonsoon 
        ? ['Heavy Monsoon Warning: Dense fog at high ridges. Stay on marked trails. Avoid climbing ladders during heavy downpours.'] 
        : [],
      forecast: [
        { date: 'Tomorrow', temp: isMonsoon ? '21°C' : '29°C', conditions: isMonsoon ? 'Showers' : 'Sunny', icon: isMonsoon ? '09d' : '01d' },
        { date: 'Day after', temp: isMonsoon ? '22°C' : '28°C', conditions: isMonsoon ? 'Heavy Rain' : 'Partly Cloudy', icon: isMonsoon ? '10d' : '02d' },
        { date: 'Next day', temp: isMonsoon ? '20°C' : '30°C', conditions: isMonsoon ? 'Misty Drizzle' : 'Sunny', icon: isMonsoon ? '50d' : '01d' },
        { date: 'Next day', temp: isMonsoon ? '21°C' : '29°C', conditions: isMonsoon ? 'Cloudy' : 'Sunny', icon: isMonsoon ? '03d' : '01d' },
        { date: 'Next day', temp: isMonsoon ? '22°C' : '28°C', conditions: isMonsoon ? 'Moderate Rain' : 'Sunny', icon: isMonsoon ? '10d' : '01d' }
      ]
    };
    return res.json(mockData);
  }

  // Check memory cache
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[Weather Cache] Serving hits for coordinate: ${cacheKey}`);
    return res.json(cached.data);
  }

  try {
    // Fetch current weather and 5-day forecast in parallel
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      throw new Error(`OpenWeather returns current: ${currentRes.status} | forecast: ${forecastRes.status}`);
    }

    const currentData = (await currentRes.json()) as OpenWeatherCurrent;
    const forecastData = (await forecastRes.json()) as OpenWeatherForecast;

    // Filter forecast to extract daily noon conditions (or 1 per 24 hour block)
    const dailyForecast = forecastData.list
      .filter((item) => item.dt_txt.includes('12:00:00'))
      .slice(0, 5)
      .map((item) => ({
        date: new Date(item.dt * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        temp: `${Math.round(item.main.temp)}°C`,
        conditions: item.weather[0]?.description || 'Cloudy',
        icon: item.weather[0]?.icon || '03d'
      }));

    // Evaluate safety warnings
    const alerts: string[] = [];
    const weatherId = currentData.weather[0]?.id || 800;
    const tempVal = currentData.main.temp;
    const windSpeedKmH = Math.round(currentData.wind.speed * 3.6);

    if (weatherId >= 200 && weatherId < 300) {
      alerts.push('Thunderstorm Alert: Extreme electrical activity. Avoid open summits and metal ladders.');
    } else if (weatherId === 502 || weatherId === 503 || weatherId === 504 || weatherId === 522) {
      alerts.push('Heavy Downpour Warning: Flooding hazard at waterfall streams. Postpone ridge crossings.');
    }

    if (windSpeedKmH > 35) {
      alerts.push(`Strong Winds Advisory (${windSpeedKmH} km/h): Watch footing on narrow mountain ridges.`);
    }

    if (tempVal > 37) {
      alerts.push(`Extreme Heat warning (${tempVal}°C): Seek shade immediately. Double hydration intake.`);
    }

    // Format final response object
    const finalReport = {
      source: 'OPENWEATHERMAP_LIVE',
      location: trekLocationName,
      temp: `${Math.round(tempVal)}°C`,
      feelsLike: `${Math.round(currentData.main.feels_like)}°C`,
      windSpeed: `${windSpeedKmH} km/h`,
      conditions: currentData.weather[0]?.description || 'Cloudy',
      humidity: `${currentData.main.humidity}%`,
      rainProbability: currentData.rain ? '80%' : '10%',
      sunrise: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sunset: new Date(currentData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: currentData.weather[0]?.icon || '02d',
      alerts: alerts,
      forecast: dailyForecast
    };

    // Save in cache
    weatherCache.set(cacheKey, {
      data: finalReport,
      timestamp: Date.now()
    });

    return res.json(finalReport);
  } catch (error) {
    console.error('Weather fetching error:', error);
    // Graceful fallback to simulated Sahyadri weather forecast
    return res.json({
      source: 'ERROR_FALLBACK_SAHYADRI_FEED',
      location: trekLocationName,
      temp: '22°C',
      feelsLike: '21°C',
      windSpeed: '12 km/h',
      conditions: 'Overcast & Foggy',
      humidity: '85%',
      rainProbability: '70%',
      sunrise: '06:04 AM',
      sunset: '07:11 PM',
      icon: '04d',
      alerts: [],
      forecast: [
        { date: 'Tomorrow', temp: '22°C', conditions: 'Misty Rain', icon: '09d' },
        { date: 'Day after', temp: '23°C', conditions: 'Showers', icon: '10d' },
        { date: 'Next day', temp: '24°C', conditions: 'Cloudy', icon: '03d' },
        { date: 'Next day', temp: '23°C', conditions: 'Partly Sunny', icon: '02d' },
        { date: 'Next day', temp: '24°C', conditions: 'Sunny Spells', icon: '01d' }
      ]
    });
  }
}
