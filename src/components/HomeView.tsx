import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Heart,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Language, useLanguage } from '../context/LanguageContext';
import { Attraction, District, DivisionName, ViewTab } from '../types';
import { VerifiedWikiImage } from './VerifiedWikiImage';

interface HomeViewProps {
  destinations: Attraction[];
  hiddenGems: Attraction[];
  districts: District[];
  favoriteIds: number[];
  onToggleFavorite: (id: number) => void;
  onSelectDestination: (dest: Attraction) => void;
  onPlanForDestination: (dest: Attraction) => void;
  onNavigateTab: (tab: ViewTab, exploreSection?: 'districts' | 'hidden-gems') => void;
  onSelectDivision: (division: DivisionName) => void;
}

const HERO_SCENES = [
  { wikiTitle: 'Raigad Fort', caption: 'Raigad Fort' },
  { wikiTitle: 'Ajanta Caves', caption: 'Ajanta Caves' },
  { wikiTitle: 'Kaas plateau', caption: 'Kaas Plateau' }
];

const DIVISION_INFO: Record<Language, Record<DivisionName, { name: string; desc: string }>> = {
  en: {
    Konkan: {
      name: 'Konkan',
      desc: '7 coastal districts: beaches, sea forts & Western Ghats'
    },
    Pune: {
      name: 'Pune',
      desc: '5 Sahyadri & Deccan districts: hill stations, Lonavala & forts'
    },
    Nashik: {
      name: 'Nashik',
      desc: '5 northern districts: Jyotirlingas, vineyards & Sahyadri peaks'
    },
    'Chhatrapati Sambhajinagar': {
      name: 'Chhatrapati Sambhajinagar',
      desc: '8 Marathwada districts: UNESCO caves & heritage'
    },
    Amravati: {
      name: 'Amravati',
      desc: '5 Western Vidarbha districts: Melghat & Lonar crater'
    },
    Nagpur: {
      name: 'Nagpur',
      desc: '6 Eastern Vidarbha districts: Tadoba, Pench & Gondia lakes'
    }
  },
  mr: {
    Konkan: {
      name: 'कोकण',
      desc: '७ किनारी जिल्हे: समुद्रकिनारे, सागरी किल्ले आणि पश्चिम घाट'
    },
    Pune: {
      name: 'पुणे',
      desc: '५ सह्याद्री व दख्खन जिल्हे: थंड हवेची ठिकाणे, लोणावळा आणि किल्ले'
    },
    Nashik: {
      name: 'नाशिक',
      desc: '५ उत्तर महाराष्ट्र जिल्हे: ज्योतिर्लिंगे, द्राक्षबागा आणि कळसुबाई शिखरे'
    },
    'Chhatrapati Sambhajinagar': {
      name: 'छत्रपती संभाजीनगर',
      desc: '८ मराठवाडा जिल्हे: युनेस्को अजिंठा-वेरूळ लेणी आणि ऐतिहासिक वारसा'
    },
    Amravati: {
      name: 'अमरावती',
      desc: '५ पश्चिम विदर्भ जिल्हे: मेळघाट व्याघ्र प्रकल्प आणि लोणार सरोवर'
    },
    Nagpur: {
      name: 'नागपूर',
      desc: '६ पूर्व विदर्भ जिल्हे: ताडोबा, पेंच राष्ट्रीय उद्यान आणि गोंदियाची तळी'
    }
  },
  hi: {
    Konkan: {
      name: 'कोंकण',
      desc: '7 तटीय जिले: समुद्र तट, समुद्री किले और पश्चिमी घाट'
    },
    Pune: {
      name: 'पुणे',
      desc: '5 सह्याद्री व दक्कन जिले: हिल स्टेशन, लोनावाला और ऐतिहासिक किले'
    },
    Nashik: {
      name: 'नासिक',
      desc: '5 उत्तरी जिले: ज्योतिर्लिंग, अंगूर के बाग और सह्याद्री की चोटियां'
    },
    'Chhatrapati Sambhajinagar': {
      name: 'छत्रपति संभाजीनगर',
      desc: '8 मराठवाड़ा जिले: यूनेस्को अजंता-एलोरा गुफाएं और ऐतिहासिक धरोहर'
    },
    Amravati: {
      name: 'अमरावती',
      desc: '5 पश्चिमी विदर्भ जिले: मेलघाट टाइगर रिजर्व और लोनार क्रेटर झील'
    },
    Nagpur: {
      name: 'नागपुर',
      desc: '6 पूर्वी विदर्भ जिले: ताडोबा, पेंच नेशनल पार्क और गोंदिया की झीलें'
    }
  }
};

export const HomeView: React.FC<HomeViewProps> = ({
  destinations,
  hiddenGems,
  districts,
  favoriteIds,
  onToggleFavorite,
  onSelectDestination,
  onPlanForDestination,
  onNavigateTab,
  onSelectDivision
}) => {
  const { language, t } = useLanguage();
  const [heroIdx, setHeroIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(destinations.map((d) => d.category)));
    return ['All', ...unique.slice(0, 6)];
  }, [destinations]);

  const iconicDestinations = useMemo(() => {
    const base = destinations.filter((d) => !d.isHiddenGem);
    if (activeCategory === 'All') return base.slice(0, 6);
    return destinations.filter((d) => d.category === activeCategory).slice(0, 6);
  }, [destinations, activeCategory]);

  const divisionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    districts.forEach((d) => {
      counts[d.division] = (counts[d.division] || 0) + 1;
    });
    return counts;
  }, [districts]);

  const featuredGems = useMemo(() => hiddenGems.slice(0, 3), [hiddenGems]);

  return (
    <div className="space-y-16 pb-16">
      {/* Crisp Hero */}
      <section className="relative min-h-[68vh] flex items-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <VerifiedWikiImage
            wikiTitle={HERO_SCENES[heroIdx].wikiTitle}
            alt={HERO_SCENES[heroIdx].caption}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b09] via-[#0d0b09]/70 to-[#0d0b09]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0b09]/90 via-[#0d0b09]/55 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-400 mb-3">
              {t('hero.badge', 'Maharashtra Explorer · MAHATRIP AI')}
            </p>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
              {t('hero.titlePre', 'Practical Trips Across')}{' '}
              <span className="bg-gradient-to-r from-[#ff6b1a] to-[#ffb84d] bg-clip-text text-transparent">
                {t('hero.titleHighlight', 'All 36 Districts')}
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-stone-200 leading-relaxed">
              {t('hero.description', 'Plan one-day bike escapes or multi-day Maharashtra circuits under your real total group budget — with same-day return timing, fuel math, and verified places.')}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => onNavigateTab('planner')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#ff6b1a] to-[#ff8c38] text-white font-semibold shadow-lg hover:brightness-110 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {t('hero.btnPlan', 'Plan a Trip (1-Day or Multi-Day)')}
              </button>
              <button
                onClick={() => onNavigateTab('explore', 'districts')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold backdrop-blur-sm transition cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                {t('hero.btnExplore', 'Explore Maharashtra')}
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2.5 text-xs text-stone-300">
              {HERO_SCENES.map((s, idx) => (
                <button
                  key={s.wikiTitle}
                  onClick={() => setHeroIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                    heroIdx === idx
                      ? 'bg-orange-500/20 border-orange-400 text-amber-300 font-semibold'
                      : 'bg-black/40 border-white/15 text-stone-300 hover:border-white/30'
                  }`}
                >
                  {s.caption}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations Across Maharashtra */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-1">
              {t('home.curatedTag', 'Curated Destinations')}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {t('home.popularHeading', 'Popular Places Across Maharashtra')}
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('explore', 'districts')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400 hover:text-orange-300 cursor-pointer shrink-0"
          >
            {t('home.viewAllDistricts', 'View All 36 Districts')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#18130f] text-stone-300 border border-white/10 hover:border-orange-500/40'
              }`}
            >
              {t(`cat.${cat}`, cat)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {iconicDestinations.map((dest) => {
            const isFav = favoriteIds.includes(dest.id);
            return (
              <article
                key={dest.id}
                className="bg-[#18130f] border border-white/10 hover:border-orange-500/40 rounded-2xl overflow-hidden flex flex-col transition group"
              >
                <div className="h-48 relative overflow-hidden">
                  <VerifiedWikiImage
                    wikiTitle={dest.wikiTitle}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <button
                    onClick={() => onToggleFavorite(dest.id)}
                    aria-label={isFav ? `Remove ${dest.name} from favorites` : `Save ${dest.name}`}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/55 hover:bg-black/80 text-white backdrop-blur-sm transition cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`}
                    />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="text-xs text-amber-400 font-medium">
                      {dest.districtName} · {t(`cat.${dest.category}`, dest.category)}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">{dest.name}</h3>
                    <p className="text-sm text-stone-400 mt-1.5 line-clamp-2">{dest.description}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-300 pb-3 border-b border-white/10 tabular-nums">
                      <span>{t('home.est', 'Est.')} ₹{dest.budget.toLocaleString('en-IN')}{t('home.perPerson', '/person')}</span>
                      <span>
                        {dest.duration === 1 ? t('home.goodFor1Day', 'Good for 1-Day') : `${dest.duration} ${t('home.days', 'Days')}`} · ★{' '}
                        {dest.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => onSelectDestination(dest)}
                        className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-stone-200 transition cursor-pointer"
                      >
                        {t('home.detailsBtn', 'Details')}
                      </button>
                      <button
                        onClick={() => onPlanForDestination(dest)}
                        className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-semibold text-white transition cursor-pointer"
                      >
                        {t('home.planTripBtn', 'Plan Trip')}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Hidden Gems Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-[#1b140f] to-[#120e0b] border border-orange-500/25 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">
                {t('gems.tag', 'Offbeat Escapes')}
              </p>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-orange-400" />
                {t('gems.heading', 'Quiet Viewpoints & Hidden Gems')}
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('explore', 'hidden-gems')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition cursor-pointer shrink-0"
            >
              {t('gems.exploreBtn', 'Explore Hidden Gems')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredGems.map((gem) => (
              <div
                key={gem.id}
                className="bg-[#110d0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="h-36 relative">
                  <VerifiedWikiImage
                    wikiTitle={gem.wikiTitle}
                    alt={gem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-amber-400 font-medium">
                      {gem.districtName} · {t(`cat.${gem.category}`, gem.category)}
                    </div>
                    <h3 className="font-bold text-white text-sm mt-1">{gem.name}</h3>
                    {gem.permitRequired && (
                      <p className="text-[11px] text-amber-300 mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {t('gems.permitAlert', 'Permit check required')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectDestination(gem)}
                    className="text-left text-xs font-semibold text-orange-400 hover:text-orange-300 cursor-pointer"
                  >
                    {t('gems.safetyNotes', 'Safety Notes & Details →')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 Divisions Quick Access */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('divisions.heading', 'Browse by Region (6 Divisions)')}</h2>
          <p className="text-sm text-stone-400 mt-1">
            {t('divisions.subtitle', "Jump straight into any of Maharashtra's 36 districts with talukas and rail/bus hubs.")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(DIVISION_INFO.en) as DivisionName[]).map((div) => {
            const info = DIVISION_INFO[language]?.[div] || DIVISION_INFO.en[div];
            return (
              <button
                key={div}
                onClick={() => onSelectDivision(div)}
                className="text-left bg-[#18130f] hover:bg-[#1e1712] border border-white/10 hover:border-orange-500/40 rounded-2xl p-5 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition">
                    {info.name} {t('divisions.division', 'Division')}
                  </h3>
                  <span className="text-xs font-semibold text-amber-400 tabular-nums">
                    {divisionCounts[div] || 0} {t('divisions.districts', 'Districts')}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  {info.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
