import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, Language, useLanguage } from '../context/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'header' | 'mobile';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'header'
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'mobile') {
    return (
      <div className={`p-2 bg-[#18130f] rounded-xl border border-white/10 ${className}`}>
        <div className="flex items-center gap-2 px-2 pb-2 mb-2 border-b border-white/10 text-xs text-stone-400">
          <Globe className="w-3.5 h-3.5 text-orange-400" />
          <span>{t('nav.chooseLanguage', 'Select Language')}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SUPPORTED_LANGUAGES.map((opt) => {
            const isSelected = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code)}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer ${isSelected
                  ? 'bg-gradient-to-r from-[#ff6b1a] to-[#ff8c38] text-white shadow'
                  : 'bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span className="text-xs">{opt.nativeName}</span>
                <span className="text-[10px] opacity-75">{opt.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t('nav.chooseLanguage', 'Select Language')}
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18130f] hover:bg-[#201914] border border-white/15 hover:border-orange-500/50 text-xs sm:text-sm font-semibold text-white whitespace-nowrap transition cursor-pointer shadow-sm"
      >
        <Globe className="w-4 h-4 text-orange-400 shrink-0" />
        <span className="font-medium text-stone-200">{currentOption.nativeName}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-400' : ''
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-[#18130f] border border-white/15 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 border-b border-white/10">
            {t('nav.chooseLanguage', 'Select Language')}
          </div>
          {SUPPORTED_LANGUAGES.map((opt) => {
            const isSelected = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs sm:text-sm flex items-center justify-between transition cursor-pointer ${isSelected
                  ? 'bg-orange-500/20 text-orange-400 font-semibold'
                  : 'text-stone-300 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{opt.nativeName}</span>
                  <span className="text-[11px] text-stone-400">{opt.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-orange-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
