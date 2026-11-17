import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CloudSun,
  ExternalLink,
  Heart,
  Info,
  MapPin,
  ShieldAlert,
  Sparkles,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../services/apiClient';
import { Attraction, ImageAttribution, WeatherResult } from '../types';

interface DestinationDetailModalProps {
  destination: Attraction | null;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onClose: () => void;
  onPlanForDestination: (dest: Attraction) => void;
}

export const DestinationDetailModal: React.FC<DestinationDetailModalProps> = ({
  destination,
  isFavorite,
  onToggleFavorite,
  onClose,
  onPlanForDestination
}) => {
  const { t } = useLanguage();
  const [gallery, setGallery] = useState<ImageAttribution[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!destination) return;
    setActiveIdx(0);
    setImgFailed(false);
    setLoadingGallery(true);
    setWeather(null);

    apiClient
      .getDestinationGallery(destination.id)
      .then((res) => {
        setGallery(res?.images || []);
      })
      .catch(() => setGallery([]))
      .finally(() => setLoadingGallery(false));

    apiClient
      .getWeather(destination.lat, destination.lng, destination.category)
      .then((res) => setWeather(res?.data || null))
      .catch(() => setWeather(null));
  }, [destination?.id]);

  if (!destination) return null;

  const activeImg = gallery[activeIdx];

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-4xl w-full text-white overflow-hidden shadow-2xl my-8 max-h-[92vh] flex flex-col">
        {/* Top Gallery Banner */}
        <div className="relative h-64 sm:h-80 w-full bg-stone-950 shrink-0">
          {loadingGallery ? (
            <div className="w-full h-full flex items-center justify-center bg-stone-900 text-stone-400 text-sm animate-pulse">
              Verifying authentic Wikimedia Commons photographs...
            </div>
          ) : activeImg && !imgFailed ? (
            <img
              src={activeImg.url}
              alt={`${destination.name} — ${activeImg.title}`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-300 p-6 text-center">
              <MapPin className="w-8 h-8 text-orange-400 mb-2" />
              <p className="font-bold text-base text-white">{destination.name}</p>
              <p className="text-xs text-stone-400 mt-1">
                Verified authentic photograph unavailable at the moment. Never substituting generic stock imagery.
              </p>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/45 pointer-events-none" />

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(destination.id)}
              className={`w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur transition-colors ${
                isFavorite
                  ? 'bg-rose-600 border-rose-400 text-white'
                  : 'bg-stone-900/80 border-white/20 text-stone-200 hover:bg-stone-800'
              }`}
              title={isFavorite ? 'Remove from Favourites' : 'Save to Favourites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center border border-white/20 backdrop-blur"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {gallery.length > 0 && (
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-end justify-between gap-2">
              <div className="flex gap-2 overflow-x-auto">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveIdx(i);
                      setImgFailed(false);
                    }}
                    className={`w-12 h-9 rounded-lg overflow-hidden border-2 shrink-0 transition-transform ${
                      activeIdx === i ? 'border-orange-500 scale-105' : 'border-white/30 opacity-75'
                    }`}
                  >
                    <img
                      src={img.thumbnailUrl || img.url}
                      alt={img.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {activeImg && (
                <a
                  href={activeImg.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-black/75 text-[11px] text-stone-200 hover:text-white flex items-center gap-1.5 max-w-xs truncate"
                >
                  <span className="truncate">
                    {activeImg.source} · {activeImg.creator} ({activeImg.license})
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Details Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
                <span className="text-orange-400 font-semibold">{destination.category}</span>
                <span aria-hidden="true">·</span>
                <span>{destination.division} Division</span>
                <span aria-hidden="true">·</span>
                <span>{destination.districtName} District</span>
                {destination.taluka && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Taluka: {destination.taluka}</span>
                  </>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{destination.name}</h2>
              <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                {destination.locality} · Coordinates: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
              </p>
            </div>

            <div className="text-right tabular-nums">
              <span className="text-[11px] text-stone-400 uppercase font-semibold">Est. Daily Cost / Person</span>
              <p className="text-2xl font-black text-amber-400">₹{destination.budget.toLocaleString()}</p>
              <p className="text-xs text-stone-400">
                {destination.duration} Day(s) · {destination.recommendedHours}
              </p>
            </div>
          </div>

          <p className="text-stone-200 text-sm sm:text-base leading-relaxed">{destination.description}</p>

          {/* Live Weather & Advisory Strip */}
          {weather && (
            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CloudSun className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white tabular-nums">
                    Live Weather: {weather.current.temperatureC}°C ({weather.current.conditionLabel}) · Wind{' '}
                    {weather.current.windKmh} km/h
                  </p>
                  <p className="text-[11px] text-stone-400">{weather.source}</p>
                </div>
              </div>
              <div className="text-xs">
                <span
                  className={`font-bold ${
                    weather.travelAdvisory.suitability === 'Ideal'
                      ? 'text-emerald-400'
                      : weather.travelAdvisory.suitability === 'Caution'
                      ? 'text-amber-300'
                      : 'text-rose-400'
                  }`}
                >
                  {weather.travelAdvisory.suitability}:
                </span>{' '}
                <span className="text-stone-300">{weather.travelAdvisory.advisories[0]}</span>
              </div>
            </div>
          )}

          {/* Core Verified Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Key Attractions & Things To Do
              </h4>
              <ul className="text-xs text-stone-300 space-y-1.5">
                {destination.popularAttractions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-stone-700/70 text-xs text-stone-300 space-y-1">
                <p>
                  <strong className="text-white">Entry Fee:</strong> {destination.entryFeeInfo}
                </p>
                <p>
                  <strong className="text-white">Opening Hours:</strong> {destination.openingHoursInfo}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Season, Accessibility & Safety
              </h4>
              <p className="text-xs text-stone-300">
                <strong className="text-white">Best Season:</strong> {destination.bestTime}
              </p>
              <p className="text-xs text-stone-300">
                <strong className="text-white">Accessibility:</strong> {destination.accessibilityInfo}
              </p>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{destination.safetyNotes}</span>
              </div>
              {destination.environmentalSensitivity && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{destination.environmentalSensitivity}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-800">
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Source: {destination.source} · Status: {destination.verificationStatus}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                {t('detail.close', 'Close')}
              </button>
              <button
                onClick={() => onPlanForDestination(destination)}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {t('detail.planTrip', 'Plan Trip Here')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
