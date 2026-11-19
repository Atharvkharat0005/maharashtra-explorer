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

export const CURATED_LANDMARK_OVERRIDES: Record<string, ImageAttribution[]> = {
  'lonar lake': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Lonar_Crater%2C_Panorama.jpg/1280px-Lonar_Crater%2C_Panorama.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Lonar_Crater%2C_Panorama.jpg/1280px-Lonar_Crater%2C_Panorama.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Lonar Crater, Panorama.jpg',
      source: 'Wikimedia Commons',
      creator: 'Aditya Laghate',
      license: 'CC BY-SA 3.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Lonar_Crater,_Panorama.jpg',
      verified: true
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Sunset_over_Lonar_Crater_Lake%2C_Maharashtra%2C_India.jpg/1280px-Sunset_over_Lonar_Crater_Lake%2C_Maharashtra%2C_India.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Sunset_over_Lonar_Crater_Lake%2C_Maharashtra%2C_India.jpg/1280px-Sunset_over_Lonar_Crater_Lake%2C_Maharashtra%2C_India.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Sunset over Lonar Crater Lake, Maharashtra, India.jpg',
      source: 'Wikimedia Commons',
      creator: 'Rohit Sharma',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Sunset_over_Lonar_Crater_Lake,_Maharashtra,_India.jpg',
      verified: true
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Panoramic_view_of_Lonar_crater_lake_from_the_rim.jpg/1280px-Panoramic_view_of_Lonar_crater_lake_from_the_rim.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Panoramic_view_of_Lonar_crater_lake_from_the_rim.jpg/1280px-Panoramic_view_of_Lonar_crater_lake_from_the_rim.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Panoramic view of Lonar crater lake from the rim.jpg',
      source: 'Wikimedia Commons',
      creator: 'Rudolph A. Furtado',
      license: 'CC BY 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Panoramic_view_of_Lonar_crater_lake_from_the_rim.jpg',
      verified: true
    }
  ],
  'kaas plateau': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Kaas-7016.jpg/1280px-Kaas-7016.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Kaas-7016.jpg/1280px-Kaas-7016.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Kaas-7016.jpg',
      source: 'Wikimedia Commons',
      creator: 'Parabsachin',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Kaas-7016.jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Kaas_world_Heritage.jpg/1280px-Kaas_world_Heritage.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Kaas_world_Heritage.jpg/1280px-Kaas_world_Heritage.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Kaas world Heritage.jpg',
      source: 'Wikimedia Commons',
      creator: 'Tanmay Haldar',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Kaas_world_Heritage.jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Kaas_Pathar%2C_Satara%2C_Maharashtra%2C_India_%282018%29_2.jpg/1280px-Kaas_Pathar%2C_Satara%2C_Maharashtra%2C_India_%282018%29_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Kaas_Pathar%2C_Satara%2C_Maharashtra%2C_India_%282018%29_2.jpg/1280px-Kaas_Pathar%2C_Satara%2C_Maharashtra%2C_India_%282018%29_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Kaas Pathar, Satara, Maharashtra, India (2018) 2.jpg',
      source: 'Wikimedia Commons',
      creator: 'Koushik 7',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Kaas_Pathar,_Satara,_Maharashtra,_India_(2018)_2.jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Kaas_pathar.jpg/1280px-Kaas_pathar.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Kaas_pathar.jpg/1280px-Kaas_pathar.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Kaas pathar.jpg',
      source: 'Wikimedia Commons',
      creator: 'Apoorva Karlekar',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Kaas_pathar.jpg',
      verified: true
    }
  ],
  'devkund waterfall': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Devkund_waterfalls.jpg/1280px-Devkund_waterfalls.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Devkund_waterfalls.jpg/1280px-Devkund_waterfalls.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Devkund waterfalls.jpg',
      source: 'Wikimedia Commons',
      creator: 'Kautuk1',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Devkund_waterfalls.jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Maharashtra%2C_Devkund.jpg/1280px-Maharashtra%2C_Devkund.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Maharashtra%2C_Devkund.jpg/1280px-Maharashtra%2C_Devkund.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Maharashtra, Devkund.jpg',
      source: 'Wikimedia Commons',
      creator: 'Abhinav Varshney',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Maharashtra,_Devkund.jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Devkund.jpg/1280px-Devkund.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Devkund.jpg/1280px-Devkund.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Devkund.jpg',
      source: 'Wikimedia Commons',
      creator: 'Devopam',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Devkund.jpg',
      verified: true
    }
  ],
  'velas, ratnagiri': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/View_of_the_Arabian_Sea_from_Bankot_Fort.jpg/1280px-View_of_the_Arabian_Sea_from_Bankot_Fort.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/View_of_the_Arabian_Sea_from_Bankot_Fort.jpg/1280px-View_of_the_Arabian_Sea_from_Bankot_Fort.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'View of the Arabian Sea from Bankot Fort.jpg',
      source: 'Wikimedia Commons',
      creator: 'Mohsin Dadarkar',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:View_of_the_Arabian_Sea_from_Bankot_Fort.jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Bankot_Fort_Panorama.jpg/1280px-Bankot_Fort_Panorama.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Bankot_Fort_Panorama.jpg/1280px-Bankot_Fort_Panorama.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Bankot Fort Panorama.jpg',
      source: 'Wikimedia Commons',
      creator: 'Mohsin Dadarkar',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Bankot_Fort_Panorama.jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Hatchlings_of_Olive_Ridley.jpg/1280px-Hatchlings_of_Olive_Ridley.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Hatchlings_of_Olive_Ridley.jpg/1280px-Hatchlings_of_Olive_Ridley.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Hatchlings of Olive Ridley.jpg',
      source: 'Wikimedia Commons',
      creator: 'Aliva Sahoo',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Hatchlings_of_Olive_Ridley.jpg',
      verified: true
    }
  ],
  'tamhini ghat': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/View_from_Tamhini_Ghat_%2851294774394%29.jpg/1280px-View_from_Tamhini_Ghat_%2851294774394%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/View_from_Tamhini_Ghat_%2851294774394%29.jpg/1280px-View_from_Tamhini_Ghat_%2851294774394%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'View from Tamhini Ghat (51294774394).jpg',
      source: 'Wikimedia Commons',
      creator: 'Dinesh Valke',
      license: 'CC BY-SA 2.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:View_from_Tamhini_Ghat_(51294774394).jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Tamhini_Ghat_%2851292773674%29.jpg/1280px-Tamhini_Ghat_%2851292773674%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Tamhini_Ghat_%2851292773674%29.jpg/1280px-Tamhini_Ghat_%2851292773674%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Tamhini Ghat (51292773674).jpg',
      source: 'Wikimedia Commons',
      creator: 'Dinesh Valke',
      license: 'CC BY-SA 2.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Tamhini_Ghat_(51292773674).jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Tamhini_Ghat_in_Rainy_season_20.JPG/1280px-Tamhini_Ghat_in_Rainy_season_20.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Tamhini_Ghat_in_Rainy_season_20.JPG/1280px-Tamhini_Ghat_in_Rainy_season_20.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Tamhini Ghat in Rainy season 20.JPG',
      source: 'Wikimedia Commons',
      creator: 'Abhijeet Safai',
      license: 'CC BY-SA 3.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Tamhini_Ghat_in_Rainy_season_20.JPG',
      verified: true
    }
  ],
  'malshej ghat': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Malshej_Ghat_%2851545521166%29.jpg/1280px-Malshej_Ghat_%2851545521166%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Malshej_Ghat_%2851545521166%29.jpg/1280px-Malshej_Ghat_%2851545521166%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Malshej Ghat (51545521166).jpg',
      source: 'Wikimedia Commons',
      creator: 'Dinesh Valke',
      license: 'CC BY-SA 2.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Malshej_Ghat_(51545521166).jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Malshej_Ghat_from_the_top.jpg/1280px-Malshej_Ghat_from_the_top.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Malshej_Ghat_from_the_top.jpg/1280px-Malshej_Ghat_from_the_top.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Malshej Ghat from the top.jpg',
      source: 'Wikimedia Commons',
      creator: 'KartikMistry',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Malshej_Ghat_from_the_top.jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/NH222_Highway_through_Malshej_Ghat_Maharashtra_India.jpg/1280px-NH222_Highway_through_Malshej_Ghat_Maharashtra_India.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/NH222_Highway_through_Malshej_Ghat_Maharashtra_India.jpg/1280px-NH222_Highway_through_Malshej_Ghat_Maharashtra_India.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'NH222 Highway through Malshej Ghat Maharashtra India.jpg',
      source: 'Wikimedia Commons',
      creator: 'Aditya Patawari',
      license: 'CC BY-SA 2.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:NH222_Highway_through_Malshej_Ghat_Maharashtra_India.jpg',
      verified: true
    }
  ],
  'sagareshwar wildlife sanctuary': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Blackbuck_Fight_in_Sagareshwar_Wildlife_Sanctuary%2C_India_%2840624643483%29.jpg/1280px-Blackbuck_Fight_in_Sagareshwar_Wildlife_Sanctuary%2C_India_%2840624643483%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Blackbuck_Fight_in_Sagareshwar_Wildlife_Sanctuary%2C_India_%2840624643483%29.jpg/1280px-Blackbuck_Fight_in_Sagareshwar_Wildlife_Sanctuary%2C_India_%2840624643483%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Blackbuck Fight in Sagareshwar Wildlife Sanctuary, India (40624643483).jpg',
      source: 'Wikimedia Commons',
      creator: 'Inside Indian Jungles',
      license: 'Public domain',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Blackbuck_Fight_in_Sagareshwar_Wildlife_Sanctuary,_India_(40624643483).jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Audumbar_at_dawn.jpg/1280px-Audumbar_at_dawn.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Audumbar_at_dawn.jpg/1280px-Audumbar_at_dawn.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Audumbar at dawn.jpg',
      source: 'Wikimedia Commons',
      creator: 'Shivrajnlad',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Audumbar_at_dawn.jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Shreekshetra_Audumbar_Temple.jpg/1280px-Shreekshetra_Audumbar_Temple.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Shreekshetra_Audumbar_Temple.jpg/1280px-Shreekshetra_Audumbar_Temple.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Shreekshetra Audumbar Temple.jpg',
      source: 'Wikimedia Commons',
      creator: 'Kautuk1',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Shreekshetra_Audumbar_Temple.jpg',
      verified: true
    }
  ],
  'sindkhed raja': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Anand_sagar_view.JPG/1280px-Anand_sagar_view.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Anand_sagar_view.JPG/1280px-Anand_sagar_view.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Anand sagar view.JPG',
      source: 'Wikimedia Commons',
      creator: 'Arvindkanojiya1',
      license: 'CC BY-SA 3.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Anand_sagar_view.JPG',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/Shri_Gajanan_Maharaj_Smruti_Mandir.jpg/1280px-Shri_Gajanan_Maharaj_Smruti_Mandir.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/Shri_Gajanan_Maharaj_Smruti_Mandir.jpg/1280px-Shri_Gajanan_Maharaj_Smruti_Mandir.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Shri Gajanan Maharaj Smruti Mandir.jpg',
      source: 'Wikimedia Commons',
      creator: 'Oleg Yunakov',
      license: 'CC0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Shri_Gajanan_Maharaj_Smruti_Mandir.jpg',
      verified: true
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Jijabai_and_Shivaji_01.jpg/1280px-Jijabai_and_Shivaji_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Jijabai_and_Shivaji_01.jpg/1280px-Jijabai_and_Shivaji_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Jijabai and Shivaji 01.jpg',
      source: 'Wikimedia Commons',
      creator: 'Pratishkhedekar',
      license: 'CC BY-SA 4.0',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Jijabai_and_Shivaji_01.jpg',
      verified: true
    }
  ]
};

CURATED_LANDMARK_OVERRIDES['kaas pathar'] = CURATED_LANDMARK_OVERRIDES['kaas plateau'];
CURATED_LANDMARK_OVERRIDES['kas plateau'] = CURATED_LANDMARK_OVERRIDES['kaas plateau'];
CURATED_LANDMARK_OVERRIDES['kas plateau reserved forest'] = CURATED_LANDMARK_OVERRIDES['kaas plateau'];

CURATED_LANDMARK_OVERRIDES['bhira, raigad'] = CURATED_LANDMARK_OVERRIDES['devkund waterfall'];
CURATED_LANDMARK_OVERRIDES['devkund'] = CURATED_LANDMARK_OVERRIDES['devkund waterfall'];

CURATED_LANDMARK_OVERRIDES['velas'] = CURATED_LANDMARK_OVERRIDES['velas, ratnagiri'];
CURATED_LANDMARK_OVERRIDES['velas & bankot konkan village'] = CURATED_LANDMARK_OVERRIDES['velas, ratnagiri'];
CURATED_LANDMARK_OVERRIDES['bankot'] = CURATED_LANDMARK_OVERRIDES['velas, ratnagiri'];

CURATED_LANDMARK_OVERRIDES['tamhini'] = CURATED_LANDMARK_OVERRIDES['tamhini ghat'];
CURATED_LANDMARK_OVERRIDES['tamhini ghat & plus valley'] = CURATED_LANDMARK_OVERRIDES['tamhini ghat'];
CURATED_LANDMARK_OVERRIDES['plus valley'] = CURATED_LANDMARK_OVERRIDES['tamhini ghat'];

CURATED_LANDMARK_OVERRIDES['malshej'] = CURATED_LANDMARK_OVERRIDES['malshej ghat'];
CURATED_LANDMARK_OVERRIDES['malshej ghat & pimpalgaon dam'] = CURATED_LANDMARK_OVERRIDES['malshej ghat'];
CURATED_LANDMARK_OVERRIDES['pimpalgaon dam'] = CURATED_LANDMARK_OVERRIDES['malshej ghat'];

CURATED_LANDMARK_OVERRIDES['sagareshwar'] = CURATED_LANDMARK_OVERRIDES['sagareshwar wildlife sanctuary'];
CURATED_LANDMARK_OVERRIDES['sagareshwar wildlife sanctuary & audumbar'] = CURATED_LANDMARK_OVERRIDES['sagareshwar wildlife sanctuary'];
CURATED_LANDMARK_OVERRIDES['audumbar'] = CURATED_LANDMARK_OVERRIDES['sagareshwar wildlife sanctuary'];

CURATED_LANDMARK_OVERRIDES['shegaon'] = CURATED_LANDMARK_OVERRIDES['sindkhed raja'];
CURATED_LANDMARK_OVERRIDES['sindkhed raja heritage & shegaon'] = CURATED_LANDMARK_OVERRIDES['sindkhed raja'];

export async function fetchWikimediaImagesForTitle(wikiTitle: string, limit = 4): Promise<ImageAttribution[]> {
  if (!wikiTitle) return [];
  const normalizedKey = wikiTitle.trim().toLowerCase();
  if (CURATED_LANDMARK_OVERRIDES[normalizedKey]) {
    return CURATED_LANDMARK_OVERRIDES[normalizedKey].slice(0, limit);
  }

  const key = `${normalizedKey}::${limit}`;
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
        // Exclude SVG icons, maps, flags, logos, space/nebula objects
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
          !lower.includes('nebula') &&
          !lower.includes('galaxy') &&
          !lower.includes('supernova') &&
          !lower.includes('telescope') &&
          !lower.includes('hubble') &&
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
