import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CloudSun,
  Crosshair,
  Hospital,
  Navigation,
  Phone,
  Pill,
  Share2,
  Shield,
  ShieldAlert
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Attraction, NearbyOsmPlace, WeatherResult } from '../types';
import { LeafletMap, MapMarker } from './LeafletMap';

interface SafetyAndMapViewProps {
  destinations: Attraction[];
  onSelectDestination: (dest: Attraction) => void;
  trustedContact?: { name: string; phone: string };
  isAuthenticated: boolean;
  onSaveTrustedContact: (name: string, phone: string) => Promise<void>;
  onToast: (msg: string, type?: 'success' | 'danger' | 'info') => void;
}

export const SafetyAndMapView: React.FC<SafetyAndMapViewProps> = ({
  destinations,
  trustedContact,
  isAuthenticated,
  onSaveTrustedContact,
  onToast
}) => {
  const [focusLat, setFocusLat] = useState<number>(18.5204);
  const [focusLng, setFocusLng] = useState<number>(73.8567);
  const [focusLabel, setFocusLabel] = useState<string>('Pune / Central Sahyadri');
  const [nearbyType, setNearbyType] = useState<'hospital' | 'police' | 'pharmacy'>('hospital');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyOsmPlace[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [routeOriginId, setRouteOriginId] = useState<number>(11);
  const [routeDestId, setRouteDestId] = useState<number>(1);
  const [osrmRoute, setOsrmRoute] = useState<{
    distanceKm: number;
    durationLabel: string;
    geometry: Array<[number, number]>;
    attribution: string;
  } | null>(null);
  const [contactName, setContactName] = useState(trustedContact?.name || '');
  const [contactPhone, setContactPhone] = useState(trustedContact?.phone || '');

  useEffect(() => {
    setContactName(trustedContact?.name || '');
    setContactPhone(trustedContact?.phone || '');
  }, [trustedContact]);

  const loadSafetyContext = (lat: number, lng: number, type: 'hospital' | 'police' | 'pharmacy') => {
    setLoadingNearby(true);
    setNearbyError(null);
    apiClient
      .getNearbyOsm(lat, lng, type)
      .then((res) => setNearbyPlaces(res?.data || []))
      .catch((err) => {
        setNearbyPlaces([]);
        setNearbyError(err?.message || 'Unable to query OpenStreetMap Overpass right now.');
      })
      .finally(() => setLoadingNearby(false));

    apiClient
      .getWeather(lat, lng)
      .then((res) => setWeather(res?.data || null))
      .catch(() => setWeather(null));
  };

  useEffect(() => {
    loadSafetyContext(focusLat, focusLng, nearbyType);
  }, [focusLat, focusLng, nearbyType]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      onToast('Geolocation is not supported by your browser.', 'danger');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFocusLat(pos.coords.latitude);
        setFocusLng(pos.coords.longitude);
        setFocusLabel('Your Current GPS Location');
        onToast('Location updated with your permission.', 'success');
      },
      () => {
        onToast(
          'Location access declined. Select any Maharashtra destination from the dropdown instead.',
          'info'
        );
      }
    );
  };

  const handleCalculateRoadRoute = async () => {
    const o = destinations.find((d) => d.id === routeOriginId);
    const d = destinations.find((dest) => dest.id === routeDestId);
    if (!o || !d) return;
    try {
      const res = await apiClient.getOsrmRoute([
        { lat: o.lat, lng: o.lng },
        { lat: d.lat, lng: d.lng }
      ]);
      setOsrmRoute(res.data);
      onToast(`OSRM Road Route: ${res.data.distanceKm} km (~${res.data.durationLabel})`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'Could not compute road route.', 'danger');
    }
  };

  const handleShareLocation = () => {
    const text = `Maharashtra Explorer Safety Check-In: My current reference coordinates are ${focusLat.toFixed(5)}, ${focusLng.toFixed(5)} (https://maps.google.com/?q=${focusLat},${focusLng}). India Emergency: 112.${
      trustedContact?.name
        ? ` Trusted contact: ${trustedContact.name} (${trustedContact.phone}).`
        : ''
    }`;
    navigator.clipboard?.writeText(text);
    onToast('Location coordinates & safety check-in copied to clipboard!', 'success');
  };

  const markers: MapMarker[] = [
    ...destinations.slice(0, 30).map((d) => ({
      id: `dest-${d.id}`,
      label: d.name,
      sublabel: `${d.category} · ${d.districtName}`,
      lat: d.lat,
      lng: d.lng,
      kind: 'attraction' as const,
      onClick: () => {
        setFocusLat(d.lat);
        setFocusLng(d.lng);
        setFocusLabel(d.name);
      }
    })),
    ...nearbyPlaces.map((p) => ({
      id: p.id,
      label: p.name,
      sublabel: `${p.type.toUpperCase()} · ${p.distanceKm} km away`,
      lat: p.lat,
      lng: p.lng,
      kind: p.type
    }))
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Emergency Banner */}
      <div className="bg-[#18130f] border border-red-500/30 text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Travel Safety &amp; Live Emergency Locator
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Maharashtra Safety Center &amp; Interactive Map
          </h1>
          <p className="text-xs text-stone-300">
            India National Emergency (Police / Ambulance / Fire):{' '}
            <strong className="text-white">112</strong> · Maharashtra Tourism (MTDC) Helpline:{' '}
            <strong className="text-white">1800-229-930</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleUseMyLocation}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Crosshair className="w-4 h-4" /> Use My Location
          </button>
          <button
            onClick={handleShareLocation}
            className="px-4 py-2.5 rounded-xl bg-[#110d0a] hover:bg-white/10 border border-white/15 text-stone-100 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Copy Check-in Coordinates
          </button>
        </div>
      </div>

      {/* Interactive Map + Road Route Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Interactive Maharashtra Map · Focus: {focusLabel}
              </h2>
              <p className="text-xs text-stone-300">
                Click any orange destination pin to load nearby hospitals, police stations,
                pharmacies, and live weather.
              </p>
            </div>
            <select
              onChange={(e) => {
                const chosen = destinations.find((d) => d.id === Number(e.target.value));
                if (chosen) {
                  setFocusLat(chosen.lat);
                  setFocusLng(chosen.lng);
                  setFocusLabel(chosen.name);
                }
              }}
              className="px-3 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-xs font-semibold text-white"
            >
              <option value="">Jump to Maharashtra Attraction...</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.districtName})
                </option>
              ))}
            </select>
          </div>

          <LeafletMap
            center={[focusLat, focusLng]}
            zoom={10}
            markers={markers}
            routePolyline={osrmRoute?.geometry || []}
            heightClass="h-[430px]"
          />

          {/* OSRM Driving Route Calculator */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-orange-400" /> Road Route (OSRM):
            </span>
            <select
              value={routeOriginId}
              onChange={(e) => setRouteOriginId(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-[#110d0a] border border-white/15 text-xs text-white"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  From: {d.name}
                </option>
              ))}
            </select>
            <select
              value={routeDestId}
              onChange={(e) => setRouteDestId(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-[#110d0a] border border-white/15 text-xs text-white"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  To: {d.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCalculateRoadRoute}
              className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
            >
              Calculate Driving Route
            </button>
            {osrmRoute && (
              <span className="text-xs font-bold text-amber-300 tabular-nums">
                {osrmRoute.distanceKm} km · {osrmRoute.durationLabel}
              </span>
            )}
          </div>
        </div>

        {/* Right Panel: Live Nearby Hospitals / Police / Pharmacies + Weather */}
        <div className="lg:col-span-4 space-y-5">
          {/* Weather & Travel Advisory */}
          {weather && (
            <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-amber-400" /> Weather &amp; Safety Status
                </h3>
                <span
                  className={`text-xs font-bold ${
                    weather.travelAdvisory.suitability === 'Ideal'
                      ? 'text-emerald-400'
                      : weather.travelAdvisory.suitability === 'Caution'
                      ? 'text-amber-300'
                      : 'text-rose-400'
                  }`}
                >
                  {weather.travelAdvisory.suitability}
                </span>
              </div>
              <p className="text-xs text-stone-200 tabular-nums">
                {weather.current.temperatureC}°C · {weather.current.conditionLabel} · Wind{' '}
                {weather.current.windKmh} km/h
              </p>
              <p className="text-xs text-stone-300">{weather.travelAdvisory.advisories[0]}</p>
            </div>
          )}

          {/* OpenStreetMap Nearby Safety Services */}
          <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Nearby Emergency Services (OSM)</h3>
            </div>
            <div className="flex gap-1.5 bg-[#110d0a] border border-white/10 p-1 rounded-xl">
              {(
                [
                  { id: 'hospital', label: 'Hospitals', icon: Hospital },
                  { id: 'police', label: 'Police', icon: Shield },
                  { id: 'pharmacy', label: 'Pharmacies', icon: Pill }
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setNearbyType(tab.id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                      nearbyType === tab.id
                        ? 'bg-orange-500 text-white'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {loadingNearby ? (
              <p className="text-xs text-stone-300 py-4 text-center">
                Querying OpenStreetMap within 12 km...
              </p>
            ) : nearbyError ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                {nearbyError}
              </div>
            ) : nearbyPlaces.length === 0 ? (
              <p className="text-xs text-stone-300 py-3">
                No mapped {nearbyType} facilities within 12 km on OpenStreetMap. Dial{' '}
                <strong className="text-white">112</strong> in an emergency.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
                {nearbyPlaces.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-[#110d0a] border border-white/10 text-xs space-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-white">{p.name}</p>
                      <span className="text-[11px] font-semibold text-amber-300 tabular-nums shrink-0">
                        {p.distanceKm} km
                      </span>
                    </div>
                    {p.address && <p className="text-[11px] text-stone-400">{p.address}</p>}
                    {p.phone && (
                      <p className="text-[11px] text-stone-200 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {p.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voluntary Trusted Contact */}
          <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Trusted Emergency Contact (Optional)</h3>
            <p className="text-[11px] text-stone-300">
              Saved only to your account when voluntarily provided. Not shared externally without
              your action.
            </p>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact Name"
              className="w-full px-3 py-2 rounded-lg bg-[#110d0a] border border-white/15 text-xs text-white placeholder-stone-400"
            />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full px-3 py-2 rounded-lg bg-[#110d0a] border border-white/15 text-xs text-white placeholder-stone-400"
            />
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  onToast('Please sign in to store a trusted contact.', 'info');
                  return;
                }
                if (!contactName || !contactPhone) {
                  onToast('Enter both name and phone number.', 'danger');
                  return;
                }
                onSaveTrustedContact(contactName, contactPhone);
              }}
              className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
            >
              Save Trusted Contact
            </button>
          </div>
        </div>
      </div>

      {/* Category-Specific Maharashtra Safety Protocols */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Monsoon Waterfalls & Ghats',
            body: 'Avoid narrow canyon treks (Sandhan Valley, Devkund) during red/orange rainfall alerts. Never step past safety railings or enter swift plunge pools.'
          },
          {
            title: 'Sahyadri Fort Trekking',
            body: 'Start treks early, carry 2L+ water per person, wear grippy shoes, and avoid exposed cliffs like Takmak Tok or Kalavantin in dense fog or high wind.'
          },
          {
            title: 'Konkan Coastal & Sea Safety',
            body: 'Check tide timings before walking to Kolaba Fort. Verify certified scuba instructors at Tarkarli; sea ferries suspend operations during monsoon squalls.'
          },
          {
            title: 'Vidarbha Wildlife Reserves',
            body: 'Stay strictly inside 4x4 safari vehicles inside Tadoba, Pench, Melghat, Navegaon, and Tipeshwar. Book official permits only via MahaEcoTourism.'
          }
        ].map((card) => (
          <div key={card.title} className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-2">
            <p className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {card.title}
            </p>
            <p className="text-xs text-stone-300 leading-relaxed">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
