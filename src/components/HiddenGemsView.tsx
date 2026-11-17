import React, { useEffect, useState } from 'react';
import { AlertTriangle, Compass, MapPin, ShieldAlert, Sparkles } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Attraction } from '../types';
import { VerifiedWikiImage } from './VerifiedWikiImage';

const HIDDEN_GEM_FILTERS = [
  'All',
  'Hidden Waterfalls',
  'Secret Viewpoints',
  'Offbeat Forts',
  'Unexplored Beaches',
  'Village Experiences',
  'Lesser-Known Temples',
  'Nature Trails',
  'Weekend Escapes',
  'Photography Locations'
] as const;

interface HiddenGemsViewProps {
  onSelectDestination: (dest: Attraction) => void;
  onPlanForDestination: (dest: Attraction) => void;
}

export const HiddenGemsView: React.FC<HiddenGemsViewProps> = ({
  onSelectDestination,
  onPlanForDestination
}) => {
  const [gems, setGems] = useState<Attraction[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .getHiddenGems({ filter: activeFilter === 'All' ? undefined : activeFilter })
      .then((res) => setGems(res?.data || []))
      .finally(() => setLoading(false));
  }, [activeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          Verified Offbeat Maharashtra · Safety &amp; Eco-Conscious Discovery
        </p>
        <h1 className="text-3xl font-black text-white">Hidden Gems of Maharashtra</h1>
        <p className="text-sm text-stone-300 max-w-3xl leading-relaxed">
          Discover verified canyons, lesser-known forts, quiet Konkan turtle villages, Satpura
          plateaus, and eastern Vidarbha sanctuaries—each vetted with seasonal restrictions, permit
          requirements, and safety advisories.
        </p>
      </div>

      {/* Filter Segmented Bar */}
      <div className="flex flex-wrap gap-2 bg-[#18130f] p-3.5 rounded-2xl border border-white/10">
        {HIDDEN_GEM_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeFilter === f
                ? 'bg-orange-500 text-white'
                : 'bg-[#110d0a] text-stone-200 border border-white/10 hover:border-orange-500/40 hover:text-white'
            }`}
          >
            {f === 'All' ? 'All Hidden Gems' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 bg-[#18130f] border border-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : gems.length === 0 ? (
        <div className="bg-[#18130f] rounded-2xl border border-white/10 p-10 text-center space-y-2">
          <Compass className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-sm font-bold text-white">No hidden gems found under &quot;{activeFilter}&quot;</p>
          <button
            onClick={() => setActiveFilter('All')}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 underline cursor-pointer"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gems.map((gem) => (
            <div
              key={gem.id}
              className="bg-[#18130f] rounded-2xl border border-white/10 hover:border-orange-500/40 overflow-hidden flex flex-col transition-colors"
            >
              <div className="h-52 w-full bg-[#110d0a]">
                <VerifiedWikiImage
                  wikiTitle={gem.wikiTitle}
                  alt={gem.name}
                  locationLabel={`${gem.districtName} District`}
                  showAttribution
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-stone-300 flex flex-wrap items-center gap-1.5">
                    <span className="text-orange-400 font-semibold">{gem.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{gem.districtName}</span>
                    {gem.permitRequired && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300 font-semibold">Permit Required</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">{gem.name}</h3>
                  <p className="text-xs text-stone-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    {gem.taluka ? `${gem.taluka}, ` : ''}
                    {gem.districtName} ({gem.division} Division)
                  </p>
                  <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">{gem.description}</p>

                  {/* Safety & Eco Notice */}
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 flex items-start gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{gem.safetyNotes}</span>
                  </div>

                  {gem.environmentalSensitivity && (
                    <div className="text-[11px] text-emerald-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{gem.environmentalSensitivity}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                      Best Season
                    </span>
                    <span className="text-xs font-semibold text-stone-100">
                      {gem.bestTime.split('(')[0]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectDestination(gem)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-stone-100 text-xs font-semibold cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => onPlanForDestination(gem)}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
