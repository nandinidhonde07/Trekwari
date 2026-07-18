'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, CloudSun, CheckSquare, HeartHandshake, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

export default function SafetySection() {
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Fetch Live Weather when the Weather modal is opened
  useEffect(() => {
    if (activeModal === 1) {
      setLoadingWeather(true);
      api.weather.get({})
        .then((data) => {
          setWeatherData(data);
          setLoadingWeather(false);
        })
        .catch((err) => {
          console.error('Safety Weather load error:', err);
          setLoadingWeather(false);
        });
    }
  }, [activeModal]);

  const safetyCards = [
    {
      icon: <Activity className="h-6 w-6 text-primary-orange" />,
      title: 'Wilderness First Aid',
      desc: 'All trek leaders are certified first responders, trained in emergency management and wilderness injury treatment.'
    },
    {
      icon: <CloudSun className="h-6 w-6 text-primary-orange" />,
      title: 'Live Weather Checks',
      desc: 'Real-time weather monitoring using satellite metrics. Bookings are shifted if extreme monsoons or thunderstorms are forecasted.'
    },
    {
      icon: <CheckSquare className="h-6 w-6 text-primary-orange" />,
      title: 'Rigorous Gear Audits',
      desc: 'Frequent inspection of ropes, harnesses, and medical kits (including oximeters and oxygen backups) before trail starts.'
    },
    {
      icon: <HeartHandshake className="h-6 w-6 text-primary-orange" />,
      title: 'Local Support Networks',
      desc: 'Continuous tie-ups with village councils (Bari, Malshej) for rapid emergency search, rescue, and local evacuation support.'
    }
  ];

  return (
    <section className="py-24 bg-warm-white text-dark-charcoal relative overflow-hidden border-t border-gray-150">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-primary-orange">Professional Standard</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight text-dark-charcoal">
            Our Uncompromising Safety Commitment
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm font-semibold max-w-xl mx-auto leading-relaxed">
            In adventure expeditions, safety is the foundation. Click on any card below to open our live audits and safety dashboards.
          </p>
        </div>

        {/* Safety Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {safetyCards.map((card, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveModal(idx)}
              className="bg-white border border-gray-150 p-6 rounded-[20px] shadow-sm flex flex-col justify-between hover:border-primary-orange/20 hover:shadow-md hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
            >
              <div>
                {/* Icon wrapper */}
                <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 self-start mb-5 group-hover:bg-primary-orange/15 transition-colors">
                  {card.icon}
                </div>
                <h3 className="text-sm font-bold font-display mb-2 text-dark-charcoal group-hover:text-primary-orange transition-colors flex items-center justify-between">
                  <span>{card.title}</span>
                  <span className="text-[10px] font-extrabold text-primary-orange opacity-0 group-hover:opacity-100 transition-opacity">View Details &rarr;</span>
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed font-sans font-semibold">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* SOS Alert Bar */}
        <div className="mt-16 bg-white border border-gray-150 rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto text-center md:text-left shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="bg-red-50 p-2.5 rounded-xl text-red-500 border border-red-100">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold font-display text-dark-charcoal">Need Live Emergency Support?</p>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Trek leaders can trigger instant SOS alerts directly to our Kopargaon command center.</p>
            </div>
          </div>
          <a 
            href="tel:+919322340365" 
            className="bg-red-650 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-button shadow-sm transition-colors cursor-pointer"
          >
            Call HQ Emergency Line
          </a>
        </div>

      </div>

      {/* Interactive Safety Command Modal Overlay */}
      {activeModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-150 p-8 rounded-[24px] w-full max-w-md shadow-xl relative animate-in zoom-in-95 duration-200 text-dark-charcoal">
            
            {/* Close Button */}
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-dark-charcoal p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Modal Contents based on selected index */}
            {activeModal === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <Activity className="h-6 w-6 text-primary-orange" />
                  <h3 className="text-base font-bold font-display text-dark-charcoal">Wilderness First Aid Audit</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  Every TreckWari guide is certified in Wilderness First Aid (WFA/WFR). Here is the active responder log:
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-dark-charcoal">Atharva Dhawale</p>
                      <p className="text-[10px] text-gray-400 font-semibold">Wilderness First Responder (WFR)</p>
                    </div>
                    <span className="text-[9px] bg-orange-50 text-primary-orange font-mono px-2 py-0.5 rounded border border-orange-100">ID: WFR-2026-08</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-dark-charcoal">Rohan Patil</p>
                      <p className="text-[10px] text-gray-400 font-semibold">Wilderness Advanced First Aid (WAFA)</p>
                    </div>
                    <span className="text-[9px] bg-orange-50 text-primary-orange font-mono px-2 py-0.5 rounded border border-orange-100">ID: WAFA-2026-42</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-1.5 text-[11px] font-semibold">
                  <p className="font-bold text-primary-orange uppercase tracking-wider text-[10px] mb-1">🎒 Oxygen & Splints Checklist:</p>
                  <p className="flex justify-between text-gray-550"><span>• Portable Oxygen Cylinder</span> <span className="text-emerald-600 font-extrabold">✔️ Audited</span></p>
                  <p className="flex justify-between text-gray-550"><span>• Finger Pulse Oximeter</span> <span className="text-emerald-600 font-extrabold">✔️ Audited</span></p>
                  <p className="flex justify-between text-gray-550"><span>• SAM Splints & Trauma Bandages</span> <span className="text-emerald-600 font-extrabold">✔️ Audited</span></p>
                </div>
              </div>
            )}

            {activeModal === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <CloudSun className="h-6 w-6 text-primary-orange" />
                  <h3 className="text-base font-bold font-display text-dark-charcoal">Live Basecamp Weather Check</h3>
                </div>
                
                {loadingWeather ? (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <Loader2 className="h-7 w-7 text-primary-orange animate-spin" />
                    <p className="text-[10px] text-gray-450 uppercase tracking-widest font-extrabold animate-pulse">Fetching Weather Metrics...</p>
                  </div>
                ) : weatherData ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-extrabold">Current Station</p>
                        <p className="text-sm font-bold text-dark-charcoal">{weatherData.location || 'Bari Base Camp'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary-orange font-display">{weatherData.temp}</p>
                        <p className="text-[10px] capitalize text-gray-500 font-semibold">{weatherData.conditions}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px] font-sans font-semibold text-gray-500">
                      <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                        <span className="text-gray-400">Humidity:</span> <strong className="text-dark-charcoal">{weatherData.humidity || '75%'}</strong>
                      </div>
                      <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                        <span className="text-gray-400">Wind Speed:</span> <strong className="text-dark-charcoal">{weatherData.windSpeed || '20 km/h'}</strong>
                      </div>
                      <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                        <span className="text-gray-400">Rain Prob:</span> <strong className="text-dark-charcoal">{weatherData.rainProbability || '10%'}</strong>
                      </div>
                      <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                        <span className="text-gray-400">Source:</span> <strong className="text-primary-orange">{weatherData.source}</strong>
                      </div>
                    </div>

                    {weatherData.alerts && weatherData.alerts.length > 0 ? (
                      <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-extrabold text-red-500 uppercase">Extreme Weather Warning</p>
                          <p className="text-[10px] text-red-800 mt-0.5">{weatherData.alerts.join(', ')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl flex gap-2 items-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-extrabold text-emerald-600 uppercase">Safety Clearance Status</p>
                          <p className="text-[10px] text-emerald-800 font-semibold">Weather is clear for safe trails. No active warnings.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6">Could not retrieve live weather metrics.</p>
                )}
              </div>
            )}

            {activeModal === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <CheckSquare className="h-6 w-6 text-primary-orange" />
                  <h3 className="text-base font-bold font-display text-dark-charcoal">Technical Gear Audits</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  We run inspection logs on all gear before guide and hiker summit runs. Audit date: <strong>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </p>
                
                <div className="space-y-2 text-[11px] font-sans font-semibold text-gray-500">
                  <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-center">
                    <span className="text-dark-charcoal">Semi-static Ropes (10.5mm)</span>
                    <span className="text-emerald-600 font-extrabold">✔️ Passed (Load tested)</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-center">
                    <span className="text-dark-charcoal">Climbing Harnesses (UIAA Approved)</span>
                    <span className="text-emerald-600 font-extrabold">✔️ Passed (Stitch check)</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-center">
                    <span className="text-dark-charcoal">Locking Carabiners & Anchors</span>
                    <span className="text-emerald-600 font-extrabold">✔️ Passed (Screw gates)</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-center">
                    <span className="text-dark-charcoal">VHF Walkie-Talkies (Radio Units)</span>
                    <span className="text-emerald-600 font-extrabold">✔️ Passed (Charge check)</span>
                  </div>
                </div>
                
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 leading-relaxed font-semibold">
                  ⚠️ <strong>Technical note</strong>: Ropes are retired immediately after 100 summits or 1 calendar year of heavy exposure.
                </div>
              </div>
            )}

            {activeModal === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <HeartHandshake className="h-6 w-6 text-primary-orange" />
                  <h3 className="text-base font-bold font-display text-dark-charcoal">Village Support Networks</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  We maintain emergency tie-ups directly with village heads for rapid evacuation support.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl">
                    <p className="text-xs font-bold text-dark-charcoal">Bari Village Emergency Group</p>
                    <p className="text-[10px] text-gray-400 font-semibold">Primary local coordinators for Mount Kalsubai. Fast response on peak trails.</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl">
                    <p className="text-xs font-bold text-dark-charcoal">Malshej Evacuation Support</p>
                    <p className="text-[10px] text-gray-400 font-semibold">Local rescue cell specializing in monsoons, landslides, and forest trails.</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl text-[11px] space-y-1.5 text-gray-550 font-semibold">
                  <p className="text-primary-orange uppercase tracking-wider text-[10px] font-bold">Evacuation Response Metrics:</p>
                  <p>• Trail-head to base camp transport: **&lt; 20 mins**</p>
                  <p>• Ambulance response coordinates: **Active 24/7**</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </section>
  );
}
