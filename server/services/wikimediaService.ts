import fs from 'fs';
import path from 'path';
import { ImageAttribution } from '../types.js';

const CACHE_DIR = path.resolve(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'wikimedia_cache.json');

interface CacheEntry {
  fetchedAt: number;
  images: ImageAttribution[];
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function loadDiskCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      for (const [k, v] of Object.entries(raw)) {
        memoryCache.set(k, v as CacheEntry);
      }
    }
  } catch {
    // Ignore corrupt cache
  }
}

function saveDiskCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    const obj: Record<string, CacheEntry> = {};
    for (const [k, v] of memoryCache.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2));
  } catch {
    // Ignore disk write issues
  }
}

loadDiskCache();

function stripHtml(html: string | undefined): string {
  if (!html) return 'Wikimedia Commons Contributor';
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export async function fetchWikimediaImagesForTitle(wikiTitle: string, limit = 4): Promise<ImageAttribution[]> {
  if (!wikiTitle) return [];
  const key = `${wikiTitle.toLowerCase()}::${limit}`;
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS && cached.images.length > 0) {
    return cached.images;
  }

  try {
    // 1. Fetch Wikipedia page main image & gallery filenames
    const wpUrl = new URL('https://en.wikipedia.org/w/api.php');
    wpUrl.searchParams.set('action', 'query');
    wpUrl.searchParams.set('titles', wikiTitle);
    wpUrl.searchParams.set('prop', 'pageimages|images');
    wpUrl.searchParams.set('piprop', 'original|thumbnail');
    wpUrl.searchParams.set('pithumbsize', '1200');
    wpUrl.searchParams.set('imlimit', '12');
    wpUrl.searchParams.set('redirects', '1');
    wpUrl.searchParams.set('format', 'json');
    wpUrl.searchParams.set('origin', '*');

    const wpRes = await fetch(wpUrl.toString(), {
      headers: { 'User-Agent': 'MaharashtraExplorer/1.0 (https://maharashtra-explorer.app)' },
      signal: AbortSignal.timeout(6000)
    });

    if (!wpRes.ok) {
      throw new Error(`Wikipedia API HTTP ${wpRes.status}`);
    }

    const wpData: any = await wpRes.json();
    const pages = wpData?.query?.pages || {};
    const page: any = Object.values(pages)[0];
    if (!page || page.missing !== undefined) {
      return [];
    }

    const candidateFiles: string[] = [];
    if (page.pageimage) {
      candidateFiles.push(`File:${page.pageimage}`);
    }
    if (Array.isArray(page.images)) {
      for (const img of page.images) {
        const title: string = img.title || '';
        const lower = title.toLowerCase();
        // Exclude SVG icons, maps, flags, logos, commons-logo, edit icons
        if (
          (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) &&
          !lower.includes('flag') &&
          !lower.includes('locator') &&
          !lower.includes('map') &&
          !lower.includes('symbol') &&
          !lower.includes('icon') &&
          !lower.includes('logo') &&
          !lower.includes('seal') &&
          !lower.includes('coat_of_arms') &&
          !candidateFiles.includes(title)
        ) {
          candidateFiles.push(title);
        }
      }
    }

    const selectedFiles = candidateFiles.slice(0, limit);
    const results: ImageAttribution[] = [];

    if (selectedFiles.length > 0) {
      const cmUrl = new URL('https://commons.wikimedia.org/w/api.php');
      cmUrl.searchParams.set('action', 'query');
      cmUrl.searchParams.set('titles', selectedFiles.join('|'));
      cmUrl.searchParams.set('prop', 'imageinfo');
      cmUrl.searchParams.set('iiprop', 'url|extmetadata|mime');
      cmUrl.searchParams.set('iiurlwidth', '1200');
      cmUrl.searchParams.set('format', 'json');
      cmUrl.searchParams.set('origin', '*');

      const cmRes = await fetch(cmUrl.toString(), {
        headers: { 'User-Agent': 'MaharashtraExplorer/1.0 (https://maharashtra-explorer.app)' },
        signal: AbortSignal.timeout(6000)
      });

      if (cmRes.ok) {
        const cmData: any = await cmRes.json();
        const cmPages: any[] = Object.values(cmData?.query?.pages || {});
        for (const p of cmPages) {
          const info = p?.imageinfo?.[0];
          if (!info || !info.url) continue;
          const meta = info.extmetadata || {};
          const license = stripHtml(meta.LicenseShortName?.value || meta.License?.value || 'Wikimedia Commons License');
          const creator = stripHtml(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons Contributor');
          results.push({
            url: info.thumburl || info.url,
            thumbnailUrl: info.thumburl || info.url,
            title: (p.title || wikiTitle).replace(/^File:/, ''),
            source: 'Wikimedia Commons',
            creator,
            license,
            originalUrl: info.descriptionurl || info.url,
            verified: true
          });
        }
      }
    }

    // Fallback to Wikipedia primary pageimage if Commons metadata call returned empty
    if (results.length === 0 && (page.thumbnail?.source || page.original?.source)) {
      results.push({
        url: page.thumbnail?.source || page.original?.source,
        thumbnailUrl: page.thumbnail?.source || page.original?.source,
        title: page.title || wikiTitle,
        source: 'Wikipedia / Wikimedia Commons',
        creator: 'Wikimedia Commons Contributor',
        license: 'Creative Commons / Public Domain (via Wikipedia)',
        originalUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, '_'))}`,
        verified: true
      });
    }

    if (results.length > 0) {
      memoryCache.set(key, { fetchedAt: Date.now(), images: results });
      saveDiskCache();
    }
    return results;
  } catch (err) {
    console.warn(`[WikimediaService] Could not verify image for "${wikiTitle}":`, (err as Error).message);
    return [];
  }
}
