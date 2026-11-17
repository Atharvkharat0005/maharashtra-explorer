import React, { useEffect, useState } from 'react';
import {
  Building2,
  Bus,
  CloudSun,
  ExternalLink,
  Plane,
  Search,
  Train,
  Utensils
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useLanguage } from '../context/LanguageContext';
import { Attraction, District, HotelListing, RestaurantListing, WeatherResult } from '../types';
import { LeafletMap } from './LeafletMap';
import { VerifiedWikiImage } from './VerifiedWikiImage';

const DIVISIONS = ['All', 'Konkan', 'Pune', 'Nashik', 'Chhatrapati Sambhajinagar', 'Amravati', 'Nagpur'] as const;

interface DistrictsExplorerViewProps {
  initialDivision?: string;
  onSelectDestination: (dest: Attraction) => void;
  onPlanForDestination: (dest: Attraction) => void;
  onPlanForDistrict: (districtName: string) => void;
}

export const DistrictsExplorerView: React.FC<DistrictsExplorerViewProps> = ({
  initialDivision,
  onSelectDestination,
  onPlanForDestination,
  onPlanForDistrict
}) => {
  const { t, language } = useLanguage();
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>(initialDivision || 'All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('raigad');
  const [selectedTaluka, setSelectedTaluka] = useState<string>('All');
  const [districtDetail, setDistrictDetail] = useState<{
    district: District;
    attractions: Attraction[];
    hotels: HotelListing[];
    restaurants: RestaurantListing[];
  } | null>(null);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (initialDivision) {
      setSelectedDivision(initialDivision);
    }
  }, [initialDivision]);

  useEffect(() => {
    setLoadingList(true);
    apiClient
      .getDistricts()
      .then((res) => {
        setDistricts(res?.data || []);
      })
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!selectedDistrictId) return;
    setLoadingDetail(true);
    setSelectedTaluka('All');
    apiClient
      .getDistrictDetail(selectedDistrictId)
      .then((res) => {
        const d = res?.data;
        if (d) {
          setDistrictDetail({
            district: d,
            attractions: d.attractions || [],
            hotels: d.hotels || [],
            restaurants: d.restaurants || []
          });
          apiClient
            .getWeather(d.lat, d.lng)
            .then((w) => setWeather(w?.data || null))
            .catch(() => setWeather(null));
        }
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedDistrictId]);

  const filteredDistricts = districts.filter((d) => {
    const matchDiv = selectedDivision === 'All' || d.division === selectedDivision;
    const q = searchQuery.trim().toLowerCase();
    const matchQ =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.aliases.some((a) => a.toLowerCase().includes(q)) ||
      d.talukas.some((t) => t.toLowerCase().includes(q)) ||
      d.keyTowns.some((t) => t.toLowerCase().includes(q));
    return matchDiv && matchQ;
  });

  const visibleAttractions =
    districtDetail?.attractions.filter((a) => {
      if (selectedTaluka === 'All') return true;
      return (a.taluka || '').toLowerCase().includes(selectedTaluka.toLowerCase());
    }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
            Administrative &amp; Tourism Hierarchy · 6 Divisions · 36 Districts
          </p>
          <h1 className="text-3xl font-black text-white mt-1">
            Explore All 36 Districts of Maharashtra
          </h1>
          <p className="text-sm text-stone-300 mt-1">
            Cascading navigation from Division → Official District (searchable by historical aliases
            like Aurangabad, Osmanabad, Ahmednagar) → Taluka → Attractions.
          </p>
        </div>
        <div className="text-xs text-stone-300 tabular-nums shrink-0">
          Showing {filteredDistricts.length} of {districts.length || 36} verified districts
        </div>
      </div>

      {/* Cascading Division Selector & Search */}
      <div className="bg-[#18130f] p-4 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('explore.searchPlaceholder', 'Search district, historical alias, taluka, or town...')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#110d0a] border border-white/15 text-sm text-white placeholder-stone-400 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {DIVISIONS.map((div) => (
              <button
                key={div}
                onClick={() => setSelectedDivision(div)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${selectedDivision === div
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#110d0a] text-stone-200 border border-white/10 hover:border-orange-500/40'
                  }`}
              >
                {div}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: 36 Districts Directory (Left) + Selected District Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Directory */}
        <div className="lg:col-span-4 bg-[#18130f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-[#110d0a] flex items-center justify-between">
            <span className="text-xs font-bold text-white">Maharashtra Districts</span>
            <span className="text-[11px] text-stone-300 tabular-nums">
              {filteredDistricts.length} listed
            </span>
          </div>
          <div className="max-h-[680px] overflow-y-auto custom-scrollbar divide-y divide-white/10">
            {loadingList ? (
              <div className="p-6 text-xs text-stone-300">Loading 36 Maharashtra districts...</div>
            ) : filteredDistricts.length === 0 ? (
              <div className="p-6 text-xs text-stone-300">No district matches your search.</div>
            ) : (
              filteredDistricts.map((d) => {
                const active = d.id === selectedDistrictId;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDistrictId(d.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors flex items-start justify-between gap-2 cursor-pointer ${active ? 'bg-orange-500/15 border-l-2 border-orange-500' : 'hover:bg-white/5'
                      }`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${active ? 'text-amber-300' : 'text-white'}`}>
                        {d.code}. {d.name}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {d.division} Division · {d.talukas.length} Talukas
                        {d.aliases.length > 0 ? ` · (${d.aliases[0]})` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-stone-300 tabular-nums shrink-0 mt-0.5">
                      {d.attractionsCount || 0} places
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right District Detail */}
        <div className="lg:col-span-8 space-y-6">
          {loadingDetail || !districtDetail ? (
            <div className="bg-[#18130f] rounded-2xl border border-white/10 p-10 text-center text-sm text-stone-300">
              Loading district profile...
            </div>
          ) : (
            <>
              {/* District Overview & Weather */}
              <div className="bg-[#18130f] rounded-2xl border border-white/10 p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-orange-400">
                      {districtDetail.district.division} Division · HQ:{' '}
                      {districtDetail.district.headquarters}
                      {districtDetail.district.aliases.length > 0 &&
                        ` · Also searched as: ${districtDetail.district.aliases.join(', ')}`}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {districtDetail.district.name} District
                    </h2>
                  </div>
                  <button
                    onClick={() => onPlanForDistrict(districtDetail.district.name)}
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Plan {districtDetail.district.name} Trip
                  </button>
                </div>

                <p className="text-sm text-stone-300 leading-relaxed">
                  {districtDetail.district.overview}
                </p>

                {/* Live Weather + Transit Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10 text-xs">
                  <div className="space-y-1.5 text-stone-300">
                    <p className="flex items-center gap-2">
                      <Train className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>
                        <strong className="text-white">Rail:</strong>{' '}
                        {districtDetail.district.majorRailwayStations.join(', ')}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>
                        <strong className="text-white">MSRTC Bus:</strong>{' '}
                        {districtDetail.district.majorBusHubs.join(', ')}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>
                        <strong className="text-white">Airport:</strong>{' '}
                        {districtDetail.district.nearestAirport}
                      </span>
                    </p>
                  </div>

                  <div className="bg-[#110d0a] rounded-xl p-3.5 border border-white/10">
                    {weather ? (
                      <div className="space-y-1">
                        <p className="font-bold text-white flex items-center gap-1.5 tabular-nums">
                          <CloudSun className="w-4 h-4 text-amber-400" />
                          {weather.current.temperatureC}°C · {weather.current.conditionLabel}
                        </p>
                        <p className="text-[11px] text-stone-300">
                          Best Season: {districtDetail.district.bestSeason}
                        </p>
                        <p className="text-[11px] text-stone-300">
                          {weather.travelAdvisory.advisories[0]}
                        </p>
                      </div>
                    ) : (
                      <p className="text-stone-300">
                        Best Season: {districtDetail.district.bestSeason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Taluka Cascading Filter */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Talukas in {districtDetail.district.name} (
                      {districtDetail.district.talukas.length})
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Select to filter district attractions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedTaluka('All')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${selectedTaluka === 'All'
                          ? 'bg-orange-500 text-white'
                          : 'bg-[#110d0a] text-stone-200 border border-white/10 hover:border-orange-500/40'
                        }`}
                    >
                      All Talukas
                    </button>
                    {districtDetail.district.talukas.map((tal) => (
                      <button
                        key={tal}
                        onClick={() => setSelectedTaluka(tal)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${selectedTaluka === tal
                            ? 'bg-orange-500 text-white'
                            : 'bg-[#110d0a] text-stone-200 border border-white/10 hover:border-orange-500/40'
                          }`}
                      >
                        {tal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* District Map */}
              <div className="bg-[#18130f] rounded-2xl border border-white/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Interactive Map — {districtDetail.district.name}
                  </h3>
                  <span className="text-[11px] text-stone-400">Click pins to inspect coordinates</span>
                </div>
                <LeafletMap
                  center={[districtDetail.district.lat, districtDetail.district.lng]}
                  zoom={9}
                  heightClass="h-64"
                  markers={[
                    {
                      id: `hq-${districtDetail.district.id}`,
                      label: `${districtDetail.district.headquarters} (District HQ)`,
                      lat: districtDetail.district.lat,
                      lng: districtDetail.district.lng,
                      kind: 'district'
                    },
                    ...visibleAttractions.map((a) => ({
                      id: a.id,
                      label: a.name,
                      sublabel: `${a.category} · ${a.locality}`,
                      lat: a.lat,
                      lng: a.lng,
                      kind: 'attraction' as const,
                      onClick: () => onSelectDestination(a)
                    }))
                  ]}
                />
              </div>

              {/* District Attractions Grid */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white">
                  Verified Tourist Attractions in {districtDetail.district.name} (
                  {visibleAttractions.length})
                </h3>
                {visibleAttractions.length === 0 ? (
                  <div className="bg-[#18130f] rounded-2xl border border-white/10 p-6 text-xs text-stone-300">
                    No attractions tagged strictly to {selectedTaluka} taluka yet. Switch to &quot;All
                    Talukas&quot; to view all places in {districtDetail.district.name}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {visibleAttractions.map((dest) => (
                      <div
                        key={dest.id}
                        className="bg-[#18130f] rounded-2xl border border-white/10 hover:border-orange-500/40 overflow-hidden flex flex-col transition-colors"
                      >
                        <div className="h-44 w-full bg-[#110d0a]">
                          <VerifiedWikiImage
                            wikiTitle={dest.wikiTitle}
                            alt={dest.name}
                            locationLabel={`${dest.districtName} District`}
                            showAttribution
                          />
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="text-[11px] text-stone-300 flex items-center gap-1.5">
                              <span className="text-orange-400 font-semibold">{dest.category}</span>
                              <span aria-hidden="true">·</span>
                              <span>{dest.taluka || dest.locality}</span>
                              {dest.isHiddenGem && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-400 font-semibold">Hidden Gem</span>
                                </>
                              )}
                            </div>
                            <h4 className="text-base font-bold text-white mt-1">{dest.name}</h4>
                            <p className="text-xs text-stone-300 mt-1.5 line-clamp-2">
                              {dest.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-amber-300 tabular-nums">
                              ~₹{dest.budget.toLocaleString()}/day
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => onSelectDestination(dest)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-stone-100 text-xs font-semibold cursor-pointer"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => onPlanForDestination(dest)}
                                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                              >
                                Plan AI
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* District Hotels & Restaurants */}
              {(districtDetail.hotels.length > 0 || districtDetail.restaurants.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {districtDetail.hotels.length > 0 && (
                    <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-orange-400" />
                        Recommended Stays &amp; MTDC Resorts
                      </h4>
                      {districtDetail.hotels.map((h) => (
                        <div key={h.id} className="pt-3 border-t border-white/10 space-y-1">
                          <p className="text-xs font-bold text-white">{h.name}</p>
                          <p className="text-[11px] text-stone-300 tabular-nums">
                            {h.propertyType} · {h.location} · Est. ₹{h.priceMin.toLocaleString()}–₹
                            {h.priceMax.toLocaleString()}/night
                          </p>
                          <a
                            href={h.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 hover:underline"
                          >
                            Check live availability on {h.bookingProvider}{' '}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {districtDetail.restaurants.length > 0 && (
                    <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-orange-400" />
                        Authentic Local Food &amp; Restaurants
                      </h4>
                      {districtDetail.restaurants.map((r) => (
                        <div key={r.id} className="pt-3 border-t border-white/10 space-y-1">
                          <p className="text-xs font-bold text-white">{r.name}</p>
                          <p className="text-[11px] text-stone-300">
                            {r.cuisine} · {r.priceRange} · {r.openingHoursInfo}
                          </p>
                          <p className="text-[11px] text-amber-300">
                            Must try: {r.specialtyDishes.join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
