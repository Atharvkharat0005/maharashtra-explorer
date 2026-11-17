import React, { useEffect, useState } from 'react';
import { Camera, MapPin } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { ImageAttribution } from '../types';

const clientImageCache = new Map<string, ImageAttribution[]>();

interface VerifiedWikiImageProps {
  wikiTitle: string;
  alt: string;
  locationLabel?: string;
  className?: string;
  showAttribution?: boolean;
  onImagesLoaded?: (images: ImageAttribution[]) => void;
}

export const VerifiedWikiImage: React.FC<VerifiedWikiImageProps> = ({
  wikiTitle,
  alt,
  locationLabel,
  className = 'w-full h-full object-cover',
  showAttribution = false,
  onImagesLoaded
}) => {
  const [images, setImages] = useState<ImageAttribution[]>(() => clientImageCache.get(wikiTitle) || []);
  const [loading, setLoading] = useState<boolean>(() => !clientImageCache.has(wikiTitle));
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setImgError(false);

    if (!wikiTitle) {
      setLoading(false);
      return;
    }

    const cached = clientImageCache.get(wikiTitle);
    if (cached) {
      setImages(cached);
      setLoading(false);
      onImagesLoaded?.(cached);
      return;
    }

    setLoading(true);
    apiClient
      .getWikimediaImages(wikiTitle)
      .then((res) => {
        if (!active) return;
        const list: ImageAttribution[] = res?.images || [];
        clientImageCache.set(wikiTitle, list);
        setImages(list);
        onImagesLoaded?.(list);
      })
      .catch(() => {
        if (!active) return;
        clientImageCache.set(wikiTitle, []);
        setImages([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [wikiTitle]);

  const primary = images[0];

  if (loading) {
    return (
      <div className="w-full h-full bg-[#1b1510] animate-pulse flex flex-col items-center justify-center text-stone-300 p-4">
        <Camera className="w-6 h-6 mb-1.5 text-stone-400" />
        <span className="text-xs font-medium">Loading Wikimedia photograph...</span>
      </div>
    );
  }

  if (!primary || imgError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 text-stone-200 flex flex-col items-center justify-center p-5 text-center">
        <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center mb-2">
          <MapPin className="w-5 h-5 text-orange-400" />
        </div>
        <p className="text-sm font-bold text-white leading-snug">{alt}</p>
        {locationLabel && <p className="text-xs text-stone-400 mt-0.5">{locationLabel}</p>}
        <p className="text-[11px] text-stone-400 mt-2">Verified photograph currently unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <img
        src={primary.url}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={className}
      />
      {showAttribution && (
        <a
          href={primary.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-stone-950/75 text-[10px] text-stone-200 hover:text-white backdrop-blur-sm max-w-[85%] truncate"
          title={`${primary.creator} · ${primary.license}`}
        >
          {primary.source} · {primary.license}
        </a>
      )}
    </div>
  );
};
