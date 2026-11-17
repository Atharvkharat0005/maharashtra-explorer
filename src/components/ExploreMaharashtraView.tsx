import React, { useEffect, useState } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Attraction } from '../types';
import { DistrictsExplorerView } from './DistrictsExplorerView';
import { HiddenGemsView } from './HiddenGemsView';

interface ExploreMaharashtraViewProps {
  initialSection?: 'districts' | 'hidden-gems';
  initialDivision?: string;
  onSelectDestination: (dest: Attraction) => void;
  onPlanForDestination: (dest: Attraction) => void;
  onPlanForDistrict: (districtName: string) => void;
}

export const ExploreMaharashtraView: React.FC<ExploreMaharashtraViewProps> = ({
  initialSection = 'districts',
  initialDivision,
  onSelectDestination,
  onPlanForDestination,
  onPlanForDistrict
}) => {
  const { t } = useLanguage();
  const [section, setSection] = useState<'districts' | 'hidden-gems'>(initialSection);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  return (
    <div className="space-y-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="inline-flex bg-[#18130f] border border-white/10 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSection('districts')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition cursor-pointer ${
              section === 'districts'
                ? 'bg-orange-500 text-white'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {t('explore.tabDistricts', 'All 36 Districts & Directory')}
          </button>
          <button
            type="button"
            onClick={() => setSection('hidden-gems')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition cursor-pointer ${
              section === 'hidden-gems'
                ? 'bg-orange-500 text-white'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            {t('explore.tabHiddenGems', 'Hidden Gems & Offbeat Spots')}
          </button>
        </div>
      </div>

      {section === 'districts' ? (
        <DistrictsExplorerView
          initialDivision={initialDivision}
          onSelectDestination={onSelectDestination}
          onPlanForDestination={onPlanForDestination}
          onPlanForDistrict={onPlanForDistrict}
        />
      ) : (
        <HiddenGemsView
          onSelectDestination={onSelectDestination}
          onPlanForDestination={onPlanForDestination}
        />
      )}
    </div>
  );
};
