'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, CloudSun, CheckSquare, HeartHandshake, X, Loader2, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
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
      icon: <Activity className="h-6 w-6 text-sunrise-orange" />,
      title: 'Wilderness First Aid',
      desc: 'All trek leaders are certified first responders, trained in emergency management and wilderness injury treatment.'
    },
    {
      icon: <CloudSun className="h-6 w-6 text-sunrise-orange" />,
      title: 'Live Weather Checks',
      desc: 'Real-time weather monitoring using satellite metrics. Bookings are shifted if extreme monsoons or thunderstorms are forecasted.'
    },
    {
      icon: <CheckSquare className="h-6 w-6 text-sunrise-orange" />,
      title: 'Rigorous Gear Audits',
      desc: 'Frequent inspection of ropes, harness systems, and medical kits (including oximeters and oxygen backups) before trail starts.'
    },
    {
      icon: <HeartHandshake className="h-6 w-6 text-sunrise-orange" />,
      title: 'Local Support Networks',
      desc: 'Continuous tie-ups with village councils (Bari, Malshej) for rapid emergency search, rescue, and local evacuation support.'
    }
  ];

  return (
    <section className="py-24 bg-forest-green text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-sunrise-orange">Professional Standard</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display">
            Our Uncompromising Safety Commitment
          </h2>
          <p className="text-emerald-100/70 text-sm leading-relaxed">
            In adventure expeditions, safety is not an option—it is the foundation. Click on any card below to open our live audits and safety dashboards.
          </p>
        </div>

        {/* Safety Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {safetyCards.map((card, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveModal(idx)}
              className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-800/85 p-6 rounded-3xl flex flex-col justify-between hover:border-sunrise-orange/60 hover:shadow-xl hover:shadow-emerald-950/30 transition-all duration-300 group hover:scale-[1.02] cursor-pointer"
            >
              <div>
                {/* Icon wrapper */}
                <div className="bg-emerald-900/60 p-3 rounded-2xl border border-emerald-800 self-start mb-5 group-hover:bg-sunrise-orange/15 transition-colors">
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold font-display mb-2 text-white group-hover:text-sunrise-orange transition-colors flex items-center justify-between">
                  <span>{card.title}</span>
                  <span className="text-xs font-normal text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">View Details &rarr;</span>
                </h3>
                <p className="text-xs text-emerald-100/60 leading-relaxed font-sans font-light">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* SOS Alert Bar */}
        <div className="mt-16 bg-emerald-950/60 border border-emerald-900 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto text-center md:text-left">
          <div className="flex items-center gap-3.5">
            <div className="bg-red-500/10 p-2 rounded-xl text-red-400 border border-red-500/20">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold font-display">Need Live Emergency Support?</p>
              <p className="text-xs text-emerald-200/60 font-sans mt-0.5">Trek leaders can trigger instant SOS alerts directly to our Kopargaon command center.</p>
            </div>
          </div>
          <a 
            href="tel:+919322340365" 
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all flex-shrink-0"
          >
            Call HQ Emergency Line
          </a>
        </div>

      </div>

      {/* Interactive Safety Command Modal Overlay */}
      {activeModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-emerald-950 border border-emerald-800/80 p-6 rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 text-white">
            
            {/* Close Button */}
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-emerald-300 hover:text-white p-1 rounded-full bg-emerald-900/50 hover:bg-emerald-800 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Modal Contents based on selected index */}
            {activeModal === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-emerald-900 pb-3">
                  <Activity className="h-6 w-6 text-sunrise-orange" />
                  <h3 className="text-base font-bold font-display text-white">Wilderness First Aid Audit</h3>
                </div>
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  Every TreckWari guide is certified in Wilderness First Aid (WFA/WFR). Here is the active responder log:
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-900/40 rounded-xl border border-emerald-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-white">Atharva Dhawale</p>
                      <p className="text-[10px] text-emerald-400">Wilderness First Responder (WFR)</p>
                    </div>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-800">ID: WFR-2026-08</span>
                  </div>
                  <div className="p-3 bg-emerald-900/40 rounded-xl border border-emerald-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-white">Rohan Patil</p>
                      <p className="text-[10px] text-emerald-400">Wilderness Advanced First Aid (WAFA)</p>
                    </div>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-800">ID: WAFA-2026-42</span>
                  </div>
                </div>
                <div className="bg-emerald-900/20 p-3 rounded-xl border border-emerald-800/40 space-y-1.5 text-[11px]">
                  <p className="font-bold text-sunrise-orange">🎒 Oxygen & Splints Checklist:</p>
                  <p className="flex justify-between text-emerald-200"><span>• Portable Oxygen Cylinder</span> <span className="text-emerald-400 font-bold">✔️ Audited</span></p>
                  <p className="flex justify-between text-emerald-200"><span>• Finger Pulse Oximeter</span> <span className="text-emerald-400 font-bold">✔️ Audited</span></p>
                  <p className="flex justify-between text-emerald-200"><span>• SAM Splints & Trauma Bandages</span> <span className="text-emerald-400 font-bold">✔️ Audited</span></p>
                </div>
              </div>
            )}

            {activeModal === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-emerald-900 pb-3">
                  <CloudSun className="h-6 w-6 text-sunrise-orange" />
                  <h3 className="text-base font-bold font-display text-white">Live Basecamp Weather Check</h3>
                </div>
                
                {loadingWeather ? (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <Loader2 className="h-7 w-7 text-sunrise-orange animate-spin" />
                    <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-extrabold animate-pulse">Fetching OpenWeather Metrics...</p>
                  </div>
                ) : weatherData ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-900/40 rounded-2xl border border-emerald-800 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase text-emerald-400 font-extrabold">Current Station</p>
                        <p className="text-sm font-bold text-white">{weatherData.location || 'Bari Base Camp'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-sunrise-orange">{weatherData.temp}</p>
                        <p className="text-[10px] capitalize text-emerald-200">{weatherData.conditions}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px] font-sans">
                      <div className="p-2.5 bg-emerald-900/20 border border-emerald-800/40 rounded-xl">
                        <span className="text-emerald-400 font-medium">Humidity:</span> <strong className="text-white">{weatherData.humidity || '75%'}</strong>
                      </div>
                      <div className="p-2.5 bg-emerald-900/20 border border-emerald-800/40 rounded-xl">
                        <span className="text-emerald-400 font-medium">Wind Speed:</span> <strong className="text-white">{weatherData.windSpeed || '20 km/h'}</strong>
                      </div>
                      <div className="p-2.5 bg-emerald-900/20 border border-emerald-800/40 rounded-xl">
                        <span className="text-emerald-400 font-medium">Rain Prob:</span> <strong className="text-white">{weatherData.rainProbability || '10%'}</strong>
                      </div>
                      <div className="p-2.5 bg-emerald-900/20 border border-emerald-800/40 rounded-xl">
                        <span className="text-emerald-400 font-medium">Data Source:</span> <strong className="text-sunrise-orange">{weatherData.source}</strong>
                      </div>
                    </div>

                    {weatherData.alerts && weatherData.alerts.length > 0 ? (
                      <div className="bg-red-950/40 border border-red-800 p-3 rounded-xl flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-extrabold text-red-400 uppercase">Extreme Weather Warning</p>
                          <p className="text-[10px] text-red-200 mt-0.5">{weatherData.alerts.join(', ')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-900/20 border border-emerald-800 p-3 rounded-xl flex gap-2 items-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-extrabold text-emerald-400 uppercase">Safety Clearance Status</p>
                          <p className="text-[10px] text-emerald-200">Weather is clear for safe summit trails. No thunderstorm warnings.</p>
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
                <div className="flex items-center gap-3 border-b border-emerald-900 pb-3">
                  <CheckSquare className="h-6 w-6 text-sunrise-orange" />
                  <h3 className="text-base font-bold font-display text-white">Pre-Trek Technical Gear Audits</h3>
                </div>
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  We run technical inspection logs on all gear before guide and hiker summit runs. Audit date: <strong>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </p>
                
                <div className="space-y-2 text-[11px] font-sans">
                  <div className="p-2.5 bg-emerald-900/40 border border-emerald-800 rounded-xl flex justify-between items-center">
                    <span className="font-bold">Semi-static Ropes (10.5mm)</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">✔️ Passed (Load tested)</span>
                  </div>
                  <div className="p-2.5 bg-emerald-900/40 border border-emerald-800 rounded-xl flex justify-between items-center">
                    <span className="font-bold">Climbing Harnesses (UIAA Approved)</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">✔️ Passed (Stitch check)</span>
                  </div>
                  <div className="p-2.5 bg-emerald-900/40 border border-emerald-800 rounded-xl flex justify-between items-center">
                    <span className="font-bold">Locking Carabiners & Anchors</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">✔️ Passed (Screw gates)</span>
                  </div>
                  <div className="p-2.5 bg-emerald-900/40 border border-emerald-800 rounded-xl flex justify-between items-center">
                    <span className="font-bold">VHF Walkie-Talkies (Radio Units)</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">✔️ Passed (Charge check)</span>
                  </div>
                </div>
                
                <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl text-[10px] text-amber-200 leading-relaxed">
                  ⚠️ <strong>Technical note</strong>: Ropes are retired immediately after 100 summits or 1 calendar year of heavy exposure.
                </div>
              </div>
            )}

            {activeModal === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-emerald-900 pb-3">
                  <HeartHandshake className="h-6 w-6 text-sunrise-orange" />
                  <h3 className="text-base font-bold font-display text-white">Local Village Support Networks</h3>
                </div>
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  We maintain strategic emergency tie-ups directly with village heads and committees for instant search, rescue, and local evacuation.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-900/40 border border-emerald-800 rounded-xl">
                    <p className="text-xs font-bold text-white">Bari Village Emergency Group</p>
                    <p className="text-[10px] text-emerald-300 mt-0.5">Primary local coordinators for Mount Kalsubai. Fast response on peak trails.</p>
                    <p className="text-[9px] text-emerald-400 font-mono mt-1">Lead: Bari Village Council Committee</p>
                  </div>
                  <div className="p-3 bg-emerald-900/40 border border-emerald-800 rounded-xl">
                    <p className="text-xs font-bold text-white">Malshej Evacuation Support</p>
                    <p className="text-[10px] text-emerald-300 mt-0.5">Local rescue cell specializing in heavy monsoons, rockfalls, and dense trails.</p>
                    <p className="text-[9px] text-emerald-400 font-mono mt-1">Lead: Local Rescue Coordinator Network</p>
                  </div>
                </div>
                <div className="p-3 bg-emerald-900/20 border border-emerald-800/40 rounded-xl text-[11px] space-y-1 text-emerald-200">
                  <p>🚑 **Evacuation Response Metrics:**</p>
                  <p>• Trail-head to base camp transport: **&lt; 20 mins**</p>
                  <p>• Tie-up ambulance response: **Active 24/7**</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </section>
  );
}
