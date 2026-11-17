import { MAHARASHTRA_ATTRACTIONS } from '../data/attractions.js';
import { MAHARASHTRA_DISTRICTS } from '../data/districts.js';
import { OFFICIAL_BOOKING_LINKS } from '../data/hospitality.js';
import {
  Attraction,
  EnRouteHiddenGem,
  RouteComparisonOption,
  TransportComparisonOption,
  TripPlanInput
} from '../types.js';
import { getOsrmRoadRoute, OsrmRouteResult } from './geoWeatherService.js';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getSeasonFromDate(dateStr: string): string {
  const month = dateStr ? new Date(dateStr).getMonth() + 1 : new Date().getMonth() + 1;
  if (month >= 6 && month <= 9) return 'Monsoon';
  if (month === 10 || month === 11) return 'Post-Monsoon';
  if (month === 12 || month <= 2) return 'Winter';
  return 'Summer';
}

/**
 * Geometric corridor detour discovery between origin and main destination.
 * Evaluates points along the path (start -> primaryDest) and selects high-value
 * verified stops/hidden gems worth a small detour given available days, safety & season.
 */
export function findHiddenGemsAlongRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  excludeAttractionIds: number[],
  input: TripPlanInput
): EnRouteHiddenGem[] {
  const directKm = haversineKm(startLat, startLng, destLat, destLng);
  if (directKm < 15) return [];

  const season = getSeasonFromDate(input.startDate);
  const maxAllowedDetourKm = input.days >= 4 ? 75 : input.days >= 2 ? 48 : 28;
  const excludeSet = new Set(excludeAttractionIds);
  const seniorsOrNeeds =
    (input.seniors || 0) > 0 || (input.accessibilityNeeds || '').trim().length > 0;

  const candidates: Array<{ score: number; item: EnRouteHiddenGem }> = [];

  for (const attr of MAHARASHTRA_ATTRACTIONS) {
    if (excludeSet.has(attr.id)) continue;

    const dOrigin = haversineKm(startLat, startLng, attr.lat, attr.lng);
    const dDest = haversineKm(attr.lat, attr.lng, destLat, destLng);

    // Exclude places basically at origin (<10km) or right on top of destination (<8km)
    if (dOrigin < 10 || dDest < 8) continue;

    // Detour estimate compared to direct path
    const detourKm = Math.max(0, Math.round(dOrigin + dDest - directKm));
    if (detourKm > maxAllowedDetourKm) continue;

    // Must lie reasonably between start & destination (neither overshooting far behind origin nor far past dest)
    if (dOrigin > directKm + 35 || dDest > directKm + 35) continue;

    const seasonMatch =
      attr.suitableSeasons.includes(season as any) ||
      attr.suitableSeasons.includes('Year-Round');

    // Safety guard for seniors / accessibility
    const strenuous =
      attr.accessibilityInfo.toLowerCase().includes('strenuous') ||
      attr.slug === 'sandhan-valley';
    if (seniorsOrNeeds && strenuous) continue;

    let score = 0;
    if (attr.isHiddenGem) score += 35;
    if (seasonMatch) score += 20;
    score += Math.max(0, 30 - detourKm * 0.5);
    score += attr.rating * 4;

    for (const interest of input.interests || []) {
      const il = interest.toLowerCase();
      if (attr.category.toLowerCase().includes(il)) score += 15;
      if (attr.tags.some((t) => t.toLowerCase().includes(il))) score += 12;
    }

    const additionalMinutes = Math.max(15, Math.round(detourKm * 1.65));
    const worthDetour = seasonMatch && detourKm <= maxAllowedDetourKm * 0.75;

    candidates.push({
      score,
      item: {
        id: attr.id,
        name: attr.name,
        category: attr.category,
        districtName: attr.districtName,
        taluka: attr.taluka,
        lat: attr.lat,
        lng: attr.lng,
        wikiTitle: attr.wikiTitle,
        detourKm,
        additionalMinutes,
        recommendedVisitDuration: attr.recommendedHours || '1.5 - 2 hours',
        entryFeeInfo: attr.entryFeeInfo,
        bestTime: attr.bestTime,
        accessibilityInfo: attr.accessibilityInfo,
        safetyNotes: attr.safetyNotes,
        whyWorthVisiting: attr.whyRecommended || attr.description,
        worthDetour,
        isHiddenGem: attr.isHiddenGem
      }
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 6).map((c) => c.item);
}

/**
 * Compares 5 practical & scenic road options between starting point and primary destination
 * using real OSRM routing data where available. Never invents closed/unsafe road claims.
 */
export async function compareMaharashtraRoutes(
  startPoint: { name: string; lat: number; lng: number },
  primaryDest: Attraction,
  enRouteGems: EnRouteHiddenGem[],
  directOsrm: OsrmRouteResult | null,
  input: TripPlanInput
): Promise<RouteComparisonOption[]> {
  const baseKm = directOsrm?.distanceKm || Math.round(haversineKm(startPoint.lat, startPoint.lng, primaryDest.lat, primaryDest.lng) * 1.28);
  const baseMins = directOsrm?.durationMinutes || Math.round((baseKm / 52) * 60);
  const season = getSeasonFromDate(input.startDate);
  const isMonsoon = season === 'Monsoon';

  const formatDur = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} hr ${m} min` : `${m} min`;
  };

  const scenicStop = enRouteGems[0];
  let scenicOsrm: OsrmRouteResult | null = null;
  if (scenicStop) {
    try {
      scenicOsrm = await getOsrmRoadRoute([
        { lat: startPoint.lat, lng: startPoint.lng },
        { lat: scenicStop.lat, lng: scenicStop.lng },
        { lat: primaryDest.lat, lng: primaryDest.lng }
      ]);
    } catch {
      scenicOsrm = null;
    }
  }

  const scenicKm = scenicOsrm?.distanceKm || baseKm + (scenicStop?.detourKm || 22);
  const scenicMins = scenicOsrm?.durationMinutes || baseMins + (scenicStop?.additionalMinutes || 35);

  const isBike = input.preferredTransport === 'Bike / Motorcycle';
  const bikeMileage = Math.max(12, Math.min(95, Number(input.bikeMileageKmPerL || 45)));
  const petrolRate = Math.max(70, Math.min(150, Number(input.petrolPricePerLitre || 105)));
  const fuelRatePerKm = isBike ? petrolRate / bikeMileage : petrolRate / 14;
  const tollPerKm = isBike ? 0 : 1.65;
  const routeNoteBike =
    'Bikes are prohibited on access-controlled Expressways (Mumbai–Pune / Samruddhi); use Old Highway / NH48 or parallel state highways and avoid night ghat riding.';

  const tollEstFast = Math.round(baseKm * tollPerKm);
  const fuelEstFast = Math.round(baseKm * fuelRatePerKm);

  const directGeom: Array<[number, number]> =
    directOsrm?.geometry?.length
      ? directOsrm.geometry
      : [
          [startPoint.lat, startPoint.lng],
          [primaryDest.lat, primaryDest.lng]
        ];

  const scenicGeom: Array<[number, number]> =
    scenicOsrm?.geometry?.length
      ? scenicOsrm.geometry
      : scenicStop
      ? [
          [startPoint.lat, startPoint.lng],
          [scenicStop.lat, scenicStop.lng],
          [primaryDest.lat, primaryDest.lng]
        ]
      : directGeom;

  return [
    {
      id: 'fastest',
      label: isBike ? 'Primary Highway (Two-Wheeler Safe)' : 'Fastest Expressway / NH Route',
      routeSummary: isBike
        ? `Main highway corridor (no expressway entry for 2-wheelers) from ${startPoint.name} to ${primaryDest.name} (${primaryDest.districtName})`
        : `Direct highway corridor from ${startPoint.name} to ${primaryDest.name} (${primaryDest.districtName})`,
      distanceKm: baseKm,
      durationLabel: formatDur(isBike ? Math.round(baseMins * 1.1) : baseMins),
      tollEstimateInr: tollEstFast,
      fuelEstimateInr: fuelEstFast,
      scenicHighlights: ['Highway fuel pumps & tea stalls', `${primaryDest.districtName} approach corridor`],
      safetyAdvisory: isBike
        ? `${routeNoteBike} ${isMonsoon ? 'Heavy rain alert: wear waterproof riding gear & watch wet tarmac.' : ''}`.trim()
        : isMonsoon
        ? 'Highway lanes remain primary safe choice during monsoon rain; observe ghat speed limits.'
        : 'Standard multi-lane highway conditions; avoid late-night driving on unlit state sections.',
      suitabilityNote: 'Best balanced one-day or family approach maximizing daylight sightseeing hours.',
      dataSource: directOsrm ? 'OSRM Live Road Network' : 'Estimated Road Corridor',
      geometry: directGeom
    },
    {
      id: 'shortest',
      label: 'Shortest Practical Corridor',
      routeSummary: `Compact state-highway connection minimizing total kilometers (~${Math.max(20, Math.round(baseKm * 0.96))} km)`,
      distanceKm: Math.max(15, Math.round(baseKm * 0.96)),
      durationLabel: formatDur(Math.round(baseMins * (isBike ? 1.12 : 1.04))),
      tollEstimateInr: Math.round(tollEstFast * 0.65),
      fuelEstimateInr: Math.round(fuelEstFast * 0.96),
      scenicHighlights: ['Rural Maharashtra towns', 'Local highway dhabas & tea stalls'],
      safetyAdvisory: 'Two-lane state sections may pass through market towns during daytime peaks.',
      suitabilityNote: 'Balanced distance & fuel savings while avoiding major bypass loops.',
      dataSource: 'OSRM / Road Corridor Estimate',
      geometry: directGeom
    },
    {
      id: 'scenic',
      label: scenicStop ? `Scenic Route via ${scenicStop.name}` : 'Scenic Sahyadri / Ghat Route',
      routeSummary: scenicStop
        ? `Includes curated scenic & hidden stop at ${scenicStop.name} (${scenicStop.districtName}) before reaching ${primaryDest.name}`
        : `Curated ghat & valley viewpoints approaching ${primaryDest.name}`,
      distanceKm: scenicKm,
      durationLabel: formatDur(scenicMins),
      tollEstimateInr: Math.round(tollEstFast * 0.75),
      fuelEstimateInr: Math.round(scenicKm * fuelRatePerKm),
      scenicHighlights:
        enRouteGems.slice(0, 3).map((g) => `${g.name} (+${g.detourKm} km detour)`).length > 0
          ? enRouteGems.slice(0, 3).map((g) => `${g.name} (+${g.detourKm} km detour)`)
          : ['Sahyadri valley overlooks', 'Ghat bends & reservoir views'],
      safetyAdvisory: isMonsoon
        ? 'Check live rainfall warnings and fog visibility along ghats before taking scenic valley detours.'
        : 'Pull over only at designated lay-bys for photography; avoid blind cliff-edge parking.',
      suitabilityNote: 'Ideal for riders, photographers, and scenic route explorers during daylight hours.',
      dataSource: scenicOsrm ? 'OSRM Multi-Waypoint Scenic Geometry' : 'Estimated Scenic Detour',
      geometry: scenicGeom
    },
    {
      id: 'budget',
      label: 'Budget-Friendly / Zero-Toll Corridor',
      routeSummary: isBike
        ? `Low-fuel, zero-toll state highway route suitable for motorcycles and MSRTC transit`
        : `Minimizes toll plazas or pairs directly with MSRTC / Railway hubs`,
      distanceKm: Math.round(baseKm * 1.02),
      durationLabel: formatDur(Math.round(baseMins * 1.15)),
      tollEstimateInr: isBike ? 0 : Math.round(tollEstFast * 0.25),
      fuelEstimateInr: Math.round(baseKm * 1.02 * fuelRatePerKm),
      scenicHighlights: ['Traditional village markets', 'Local Misal / Vada Pav stops'],
      safetyAdvisory: 'Plan daytime arrival before sunset for ghat returns.',
      suitabilityNote: 'Keeps transport spending minimal so more budget stays for food and entry tickets.',
      dataSource: 'Maharashtra Corridor & Fuel Estimate',
      geometry: directGeom
    },
    {
      id: 'adventure',
      label: 'Ghat & Fort Foothill Corridor',
      routeSummary: `Connects historic Maratha fort foothills & forest viewpoints toward ${primaryDest.districtName}`,
      distanceKm: Math.round(scenicKm * 1.04),
      durationLabel: formatDur(Math.round(scenicMins * 1.14)),
      tollEstimateInr: Math.round(tollEstFast * 0.5),
      fuelEstimateInr: Math.round(scenicKm * 1.04 * fuelRatePerKm),
      scenicHighlights:
        enRouteGems
          .filter((g) => g.category === 'Forts' || g.category === 'Waterfalls' || g.category === 'Trekking')
          .slice(0, 2)
          .map((g) => `${g.name} (${g.category})`)
          .concat(['Ghat hairpin photography bends'])
          .slice(0, 3),
      safetyAdvisory: isMonsoon
        ? 'NOT recommended during heavy-rain Red/Orange alerts due to slippery ghat hairpins & landslide risk; use Primary Highway instead.'
        : 'Inspect brakes, tyre tread, and mirror alignment before riding mountain ghats.',
      suitabilityNote:
        input.adventureLevel === 'Relaxed' || (input.seniors || 0) > 0
          ? 'Caution: Winding ghat sections may be tiring for relaxed itineraries or seniors.'
          : 'Recommended for riders, trekkers, and fort enthusiasts in clear daylight weather.',
      dataSource: 'OSRM & Regional Terrain Advisory',
      geometry: scenicGeom
    }
  ];
}

/**
 * Multi-modal transport comparison engine grounded in real 36-district rail/bus hubs and Bike fuel math.
 * Never fabricates live train numbers, exact departure times, or seat availability.
 */
export function buildTransportComparison(
  startName: string,
  primaryDest: Attraction,
  roadKm: number,
  driveMinutes: number,
  input: TripPlanInput
): TransportComparisonOption[] {
  const groupSize = Math.max(1, (input.adults || 1) + (input.children || 0) + (input.seniors || 0));
  const payingHeads = Math.max(1, (input.adults || 1) + (input.seniors || 0) + (input.children || 0) * 0.7);
  const days = input.tripType === 'one-day' ? 1 : Math.max(1, Number(input.days || 1));

  const startDistrict =
    MAHARASHTRA_DISTRICTS.find(
      (d) =>
        d.name.toLowerCase().includes(startName.toLowerCase()) ||
        d.headquarters.toLowerCase().includes(startName.toLowerCase()) ||
        d.aliases.some((a) => a.toLowerCase().includes(startName.toLowerCase()))
    ) || MAHARASHTRA_DISTRICTS.find((d) => d.id === 'pune')!;

  const destDistrict =
    MAHARASHTRA_DISTRICTS.find((d) => d.id === primaryDest.districtId) || startDistrict;

  const sightseeingKm = days === 1 ? Math.min(24, Math.max(10, Math.round(roadKm * 0.24))) : Math.min(80, days * 20);
  const totalRouteKm = roadKm * 2 + sightseeingKm;
  const bikeMileage = Math.max(12, Math.min(95, Number(input.bikeMileageKmPerL || 45)));
  const petrolRate = Math.max(70, Math.min(150, Number(input.petrolPricePerLitre || 105)));
  const bikeFuelEst = Math.round((totalRouteKm / bikeMileage) * petrolRate);

  const carFuelOrCabEst = Math.round(totalRouteKm * (input.preferredTransport === 'Car' || input.preferredTransport === 'Self-Drive' ? 8 : 13));
  const trainRoundTripGroup = Math.round(payingHeads * Math.max(120, Math.min(2200, roadKm * 2.1)));
  const busRoundTripGroup = Math.round(payingHeads * Math.max(180, Math.min(2400, roadKm * 2.8)));
  const localRoundGroup = Math.round(groupSize * days * 220);

  const driveHrs = Math.floor(driveMinutes / 60);
  const driveMinsRem = driveMinutes % 60;
  const driveStr = `${driveHrs > 0 ? `${driveHrs} hr ` : ''}${driveMinsRem} min one-way`;

  return [
    {
      mode: 'Bike / Motorcycle',
      provider: `Personal Bike (${bikeMileage} km/L @ ₹${petrolRate}/L)`,
      originHub: `${startName} (Old Hwy / NH48)`,
      destinationHub: `${primaryDest.name}, ${destDistrict.name}`,
      estimatedDuration: `Approx. ${driveStr} (~${roadKm} km one-way, ₹0 toll)`,
      approxGroupCostInr: bikeFuelEst,
      approxPerPersonInr: Math.round(bikeFuelEst / groupSize),
      pricingBasis: 'OSRM Fuel & Toll Estimate',
      comfortScore: groupSize <= 2 ? 'High Freedom (Best for 1–2 riders on budget)' : 'Best for 1–2 riders per motorcycle',
      suitabilityNote: `Round-trip + ${sightseeingKm} km local riding (${totalRouteKm} km total) costs ~₹${bikeFuelEst}. Start early & return before dark; no Expressway access.`,
      bookingUrl: 'https://www.openstreetmap.org/',
      availabilityNotice: 'Fuel calculated from road distance ÷ mileage × petrol price. Confirm helmet & bike docs.'
    },
    {
      mode: 'Train',
      provider: OFFICIAL_BOOKING_LINKS.trains.provider,
      originHub: startDistrict.majorRailwayStations[0] || `${startName} Railway Station`,
      destinationHub: destDistrict.majorRailwayStations[0] || `${destDistrict.name} Nearest Railhead`,
      estimatedDuration: `Approx. ${Math.max(1, Math.round(roadKm / 55))}–${Math.max(2, Math.round(roadKm / 42))} hrs (varies by train)`,
      approxGroupCostInr: trainRoundTripGroup,
      approxPerPersonInr: Math.round(trainRoundTripGroup / groupSize),
      pricingBasis: 'Published / Regional Estimate',
      comfortScore: 'High (Weather-resilient & affordable)',
      suitabilityNote: `Budget-friendly if ${destDistrict.majorRailwayStations[0] || destDistrict.name} railhead connects smoothly; add local auto/bus at destination.`,
      bookingUrl: OFFICIAL_BOOKING_LINKS.trains.url,
      availabilityNotice: 'Check live trains, exact departure times, and PNR/seat availability directly on IRCTC.'
    },
    {
      mode: 'Bus (MSRTC)',
      provider: OFFICIAL_BOOKING_LINKS.buses.provider,
      originHub: startDistrict.majorBusHubs[0] || `${startName} ST Stand`,
      destinationHub: destDistrict.majorBusHubs[0] || `${destDistrict.name} MSRTC Bus Stand`,
      estimatedDuration: `Approx. ${driveStr} (+ bus stops)`,
      approxGroupCostInr: busRoundTripGroup,
      approxPerPersonInr: Math.round(busRoundTripGroup / groupSize),
      pricingBasis: 'Published / Regional Estimate',
      comfortScore: 'Moderate (Shivneri AC / Shivshahi / ST Ordinary)',
      suitabilityNote: `Direct state bus connectivity to major talukas in ${destDistrict.name} District without needing own vehicle.`,
      bookingUrl: OFFICIAL_BOOKING_LINKS.buses.url,
      availabilityNotice: 'Verify live bus departures and seat availability directly on MSRTC portal.'
    },
    {
      mode: 'Private Car / Taxi',
      provider: 'Own Car / Local Outstation Cab',
      originHub: `${startName} Doorstep`,
      destinationHub: `${primaryDest.name}, ${destDistrict.name} Doorstep`,
      estimatedDuration: `${driveStr} (OSRM Road Estimate, ~${roadKm} km)`,
      approxGroupCostInr: carFuelOrCabEst,
      approxPerPersonInr: Math.round(carFuelOrCabEst / groupSize),
      pricingBasis: 'OSRM Fuel & Toll Estimate',
      comfortScore: 'High Comfort (Recommended for Families & Seniors)',
      suitabilityNote: `Best for groups of 3–6 or families with seniors/kids.`,
      bookingUrl: 'https://www.savaari.com/',
      availabilityNotice: 'Estimated round-trip fuel / cab cost; toll charges apply on 4-wheelers.'
    },
    {
      mode: 'Local Transport',
      provider: 'Auto-rickshaws & Shared Local Transport',
      originHub: `${destDistrict.headquarters} / Railhead`,
      destinationHub: `Local sights in ${destDistrict.name}`,
      estimatedDuration: 'Short hops (15–40 mins per attraction)',
      approxGroupCostInr: localRoundGroup,
      approxPerPersonInr: Math.round(localRoundGroup / groupSize),
      pricingBasis: 'Published / Regional Estimate',
      comfortScore: 'Point-to-point Convenience',
      suitabilityNote: 'Needed mainly if arriving via Train or MSRTC Bus.',
      bookingUrl: OFFICIAL_BOOKING_LINKS.buses.url,
      availabilityNotice: 'Confirm shared auto/local fares upfront.'
    }
  ];
}
