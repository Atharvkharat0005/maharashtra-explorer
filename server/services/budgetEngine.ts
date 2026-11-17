import { BudgetBreakdown, FuelCalculationDetails, TripPlanInput } from '../types.js';

/**
 * Deterministic Group Budget Engine:
 * - Entered budget is ALWAYS the maximum limit for the ENTIRE GROUP.
 * - One-Day Trip: accommodation = 0, rooms = 0, return journey included on same day.
 * - Bike / Motorcycle Mode: uses actual OSRM round-trip road distance + sightseeing loop,
 *   mileage (km/litre), and petrol price (INR/litre) with zero highway toll for 2-wheelers.
 * - Never silently overshoots budget; shifts paid add-ons to optionalExpenses and uses
 *   affordable Maharashtra local meals & free viewpoints when budget is tight.
 */
export function calculateGroupBudget(
  input: TripPlanInput,
  estimatedRoadDistanceKm: number,
  targetAttractionCount: number,
  distanceSourceLabel = 'Estimated Maharashtra Road Distance'
): BudgetBreakdown {
  const adults = Math.max(1, Number(input.adults || 1));
  const children = Math.max(0, Number(input.children || 0));
  const seniors = Math.max(0, Number(input.seniors || 0));
  const groupSize = adults + children + seniors;

  const isOneDay = input.tripType === 'one-day' || Number(input.days || 1) <= 1;
  const tripType: 'one-day' | 'multi-day' = isOneDay ? 'one-day' : 'multi-day';
  const days = isOneDay ? 1 : Math.max(1, Number(input.days || 2));
  const nights = isOneDay ? 0 : Math.max(0, days - 1);
  const rooms = isOneDay ? 0 : Math.max(1, Number(input.rooms || Math.ceil(groupSize / 2)));

  // Respect user's exact group budget down to ₹100 without artificially inflating it
  const totalGroupBudget = Math.max(100, Number(input.totalGroupBudget || 2000));
  const perHeadBudget = totalGroupBudget / Math.max(1, groupSize);
  const isTightBudget = isOneDay ? perHeadBudget <= 1500 : perHeadBudget / days <= 1800;

  const styleFactor =
    isTightBudget || input.travelStyle === 'budget'
      ? 0.65
      : input.travelStyle === 'premium'
      ? 1.4
      : input.travelStyle === 'luxury'
      ? 2.1
      : 1.0;

  const effectiveFoodHeads = adults + seniors + children * 0.65;
  const oneWayRoadKm = Math.max(4, Math.round(estimatedRoadDistanceKm));
  const roundTripBaseKm = oneWayRoadKm * 2;
  const sightseeingDetourKm =
    typeof input.sightseeingExtraKm === 'number' && input.sightseeingExtraKm >= 0
      ? Math.round(input.sightseeingExtraKm)
      : isOneDay
      ? Math.min(24, Math.max(10, Math.round(oneWayRoadKm * 0.24)))
      : Math.min(90, days * 22);
  const totalRouteKm = roundTripBaseKm + sightseeingDetourKm;

  const mode = input.preferredTransport || 'Car';
  const isBike = mode === 'Bike / Motorcycle';
  const isCar = mode === 'Car' || mode === 'Self-Drive' || mode === 'Car / Taxi';
  const isTrain = mode === 'Train';
  const isBus = mode === 'Bus' || mode === 'Bus (MSRTC)';
  const isWalking = mode === 'Walking';

  let transportation = 0;
  let fuelCost = 0;
  let parkingAndTolls = 0;
  let localTransportation = 0;
  let fuelCalculation: FuelCalculationDetails | undefined;

  if (isBike) {
    const mileage = Math.max(12, Math.min(95, Number(input.bikeMileageKmPerL || 45)));
    const petrolPrice = Math.max(70, Math.min(150, Number(input.petrolPricePerLitre || 105)));
    const litresRaw = totalRouteKm / mileage;
    const fuelRequiredLitres = Math.round(litresRaw * 100) / 100;
    fuelCost = Math.round(litresRaw * petrolPrice);
    // Two-wheelers have ₹0 tolls on Maharashtra highways; only destination parking (~₹40–₹60/day)
    parkingAndTolls = days * 50;
    transportation = 0;
    localTransportation = 0;

    fuelCalculation = {
      applicable: true,
      vehicleMode: 'Bike / Motorcycle',
      oneWayRoadKm,
      roundTripBaseKm,
      sightseeingDetourKm,
      totalDistanceKm: totalRouteKm,
      mileageKmPerLitre: mileage,
      petrolPricePerLitre: petrolPrice,
      fuelRequiredLitres,
      fuelCostInr: fuelCost,
      distanceSource: distanceSourceLabel,
      priceSource: input.petrolPricePerLitre
        ? `User-entered petrol rate (₹${petrolPrice}/L)`
        : `Estimated Maharashtra petrol rate (₹${petrolPrice}/L, editable)`,
      formulaSummary: `${totalRouteKm} km ÷ ${mileage} km/L = ${fuelRequiredLitres} L × ₹${petrolPrice}/L ≈ ₹${fuelCost.toLocaleString('en-IN')}`
    };
  } else if (isCar) {
    if (mode === 'Car' || mode === 'Self-Drive') {
      const carMileage = Math.max(8, Math.min(35, Number(input.bikeMileageKmPerL || 15)));
      const petrolPrice = Math.max(70, Math.min(150, Number(input.petrolPricePerLitre || 105)));
      const litresRaw = totalRouteKm / carMileage;
      const fuelRequiredLitres = Math.round(litresRaw * 100) / 100;
      fuelCost = Math.round(litresRaw * petrolPrice);
      parkingAndTolls = Math.round((totalRouteKm / 100) * 180 + days * 100);
      transportation = 0;
      localTransportation = 0;

      fuelCalculation = {
        applicable: true,
        vehicleMode: 'Car',
        oneWayRoadKm,
        roundTripBaseKm,
        sightseeingDetourKm,
        totalDistanceKm: totalRouteKm,
        mileageKmPerLitre: carMileage,
        petrolPricePerLitre: petrolPrice,
        fuelRequiredLitres,
        fuelCostInr: fuelCost,
        distanceSource: distanceSourceLabel,
        priceSource: `Estimated petrol rate (₹${petrolPrice}/L, mileage ${carMileage} km/L)`,
        formulaSummary: `${totalRouteKm} km ÷ ${carMileage} km/L = ${fuelRequiredLitres} L × ₹${petrolPrice}/L ≈ ₹${fuelCost.toLocaleString('en-IN')}`
      };
    } else {
      // Hired Taxi / Cab
      const vehicleRatePerKm = groupSize <= 4 ? 13 : 18;
      transportation = Math.round(Math.max(totalRouteKm * vehicleRatePerKm, days * 2200));
      parkingAndTolls = Math.round((totalRouteKm / 100) * 180 + days * 100);
      localTransportation = 0;
    }
  } else if (isTrain) {
    const classFactor = isTightBudget ? 0.65 : 1.05;
    const perTicketRoundTrip = Math.max(60, Math.round((roundTripBaseKm * 0.72 + 40) * classFactor));
    transportation = Math.round(perTicketRoundTrip * (adults + seniors + children * 0.5));
    localTransportation = Math.round(days * (isTightBudget ? 220 : 480) * Math.ceil(groupSize / 4));
    parkingAndTolls = 0;
  } else if (isBus) {
    const perBusRoundTrip = Math.max(80, Math.round(roundTripBaseKm * 1.25));
    transportation = Math.round(perBusRoundTrip * (adults + seniors + children * 0.5));
    localTransportation = Math.round(days * (isTightBudget ? 200 : 420) * Math.ceil(groupSize / 4));
    parkingAndTolls = 0;
  } else if (isWalking) {
    transportation = 0;
    localTransportation = 0;
    parkingAndTolls = 0;
  } else {
    // Public transport (Local rail + MSRTC + shared auto mix)
    const perPublicRoundTrip = Math.max(60, Math.round(roundTripBaseKm * 1.0));
    transportation = Math.round(perPublicRoundTrip * (adults + seniors + children * 0.6));
    localTransportation = Math.round(days * 180 * Math.ceil(groupSize / 4));
    parkingAndTolls = 0;
  }

  // 2. Accommodation (Strictly 0 for One-Day Trips!)
  let accommodation = 0;
  let roomRatePerNight = 0;
  if (!isOneDay && input.accommodationPreference !== 'None (Same-Day Return)') {
    roomRatePerNight = 2000;
    if (input.accommodationPreference === 'Budget / Homestay' || isTightBudget) {
      roomRatePerNight = 1200;
    } else if (input.accommodationPreference === 'Premium Resort' || input.travelStyle === 'premium') {
      roomRatePerNight = 4000;
    } else if (input.accommodationPreference === 'Luxury Heritage' || input.travelStyle === 'luxury') {
      roomRatePerNight = 7200;
    }
    accommodation = nights * rooms * roomRatePerNight;
  }

  // Calculate fixed base before discretionary food/entries/activities
  const fixedMobilityAndStay = transportation + fuelCost + parkingAndTolls + localTransportation + accommodation;
  const remainingForDaySpend = Math.max(0, totalGroupBudget - fixedMobilityAndStay);

  // 3. Food & Drinking Water (adapts realistically to group budget headroom)
  const comfortableMealPerHeadPerDay = Math.round((isOneDay ? 360 : 480) * styleFactor);
  let rawFood = Math.round(days * effectiveFoodHeads * comfortableMealPerHeadPerDay);
  const minimumViableFoodPerHeadPerDay = 140; // Poha/Vada Pav + basic thali + water bottles
  const minFood = Math.round(days * effectiveFoodHeads * minimumViableFoodPerHeadPerDay);

  if (rawFood > remainingForDaySpend * 0.65) {
    rawFood = Math.max(minFood, Math.round(remainingForDaySpend * 0.55));
  }
  const foodAndBeverages = rawFood;

  // 4. Entry Fees (prioritize free viewpoints/lakes when budget is tight)
  const payingVisitors = adults + seniors + children * 0.5;
  const maxEntryAllowable = Math.max(0, totalGroupBudget - (fixedMobilityAndStay + foodAndBeverages));
  let entryFees = Math.round(Math.min(targetAttractionCount, 3) * (isTightBudget ? 25 : 60) * payingVisitors);
  if (entryFees > maxEntryAllowable * 0.5) {
    entryFees = Math.min(entryFees, Math.round(maxEntryAllowable * 0.35));
  }

  // 5. Activities (Strictly 0 essential activities for tight/one-day budgets; separated into optionalExpenses)
  const optionalExpenses: Array<{ label: string; estimatedCostInr: number; note: string }> = [
    {
      label: 'Boating / Lake Pedalo / Water Activities',
      estimatedCostInr: Math.round(payingVisitors * 250),
      note: 'Optional paid activity; skip to stay comfortably within budget.'
    },
    {
      label: 'Local Heritage / Cave Certified Guide',
      estimatedCostInr: 400,
      note: 'Optional shared group guide for forts or ASI caves.'
    },
    {
      label: 'Chikki, Souvenirs & Cafe Extras',
      estimatedCostInr: Math.round(groupSize * 150),
      note: 'Optional personal shopping allowance.'
    }
  ];

  const remainingAfterFoodEntry = Math.max(0, totalGroupBudget - (fixedMobilityAndStay + foodAndBeverages + entryFees));
  let activities = 0;
  if (!isTightBudget && remainingAfterFoodEntry > days * groupSize * 450) {
    const activityRate = input.adventureLevel === 'High Adventure / Trekking' ? 450 : 300;
    activities = Math.round(days * 0.5 * payingVisitors * activityRate);
  }

  // 6. Other Necessary Expenses (water refills, tyre/puncture/tea break buffer)
  const remainingAfterAct = Math.max(0, remainingAfterFoodEntry - activities);
  let miscellaneous = Math.round(days * groupSize * (isTightBudget ? 45 : 95));
  if (miscellaneous > remainingAfterAct * 0.5) {
    miscellaneous = Math.min(miscellaneous, Math.round(remainingAfterAct * 0.4));
  }

  // 7. Emergency Reserve (keeps inside budget ceiling when possible, else realistic minimum)
  const preReserveTotal =
    fixedMobilityAndStay + foodAndBeverages + entryFees + activities + miscellaneous;
  const rawReserve = Math.max(100, Math.round(preReserveTotal * 0.08));
  const remainingBeforeReserve = totalGroupBudget - preReserveTotal;
  const emergencyReserve =
    remainingBeforeReserve >= rawReserve
      ? rawReserve
      : remainingBeforeReserve >= 50
      ? Math.min(rawReserve, Math.round(remainingBeforeReserve * 0.7))
      : Math.min(100, Math.round(preReserveTotal * 0.05));

  const estimatedTotalCost = preReserveTotal + emergencyReserve;
  const perPersonCost = Math.round(estimatedTotalCost / groupSize);
  const costPerDay = Math.round(estimatedTotalCost / days);
  const remainingBudget = totalGroupBudget - estimatedTotalCost;
  const isOverBudget = remainingBudget < 0;
  const overBudgetBy = isOverBudget ? Math.abs(remainingBudget) : 0;

  const budgetFeasibility: 'COMFORTABLE' | 'TIGHT_FIT' | 'INSUFFICIENT' = isOverBudget
    ? 'INSUFFICIENT'
    : remainingBudget >= Math.max(200, totalGroupBudget * 0.15)
    ? 'COMFORTABLE'
    : 'TIGHT_FIT';

  const budgetWarnings: string[] = [];
  const budgetOptimizationTips: string[] = [];

  if (isOverBudget) {
    budgetWarnings.push(
      `Minimum essential trip cost (₹${estimatedTotalCost.toLocaleString('en-IN')}) exceeds your total group budget of ₹${totalGroupBudget.toLocaleString('en-IN')} by ₹${overBudgetBy.toLocaleString('en-IN')}.`
    );
    if (isBike || isCar) {
      budgetOptimizationTips.push(
        `Fuel alone requires ~₹${fuelCost.toLocaleString('en-IN')}. Pick a closer destination within 25–45 km or travel via MSRTC/Local train.`
      );
    }
    if (!isOneDay && nights > 0) {
      budgetOptimizationTips.push(
        'Switch to a One-Day Same-Day Return trip (₹0 accommodation) or use a low-fare MSRTC bus/train.'
      );
    }
    budgetOptimizationTips.push(
      'Carry drinking water and light snacks from home, and stick strictly to free natural viewpoints.'
    );
  } else {
    budgetOptimizationTips.push(
      `Essential expenses fit within your ₹${totalGroupBudget.toLocaleString('en-IN')} group limit with ₹${remainingBudget.toLocaleString('en-IN')} left unspent (after setting aside ₹${emergencyReserve.toLocaleString('en-IN')} emergency reserve).`
    );
    if (isBike) {
      budgetOptimizationTips.push(
        'Two-wheelers pay ₹0 toll on Maharashtra highways; save ₹150–₹400 more by packing refillable water bottles.'
      );
    }
  }

  return {
    tripType,
    totalGroupBudget,
    groupSize,
    adults,
    children,
    seniors,
    rooms,
    days,
    categories: {
      transportation,
      fuelCost,
      accommodation,
      foodAndBeverages,
      entryFees,
      activities,
      localTransportation,
      parkingAndTolls,
      miscellaneous,
      emergencyReserve
    },
    fuelCalculation,
    optionalExpenses,
    estimatedTotalCost,
    perPersonCost,
    costPerDay,
    remainingBudget,
    isOverBudget,
    overBudgetBy,
    budgetFeasibility,
    budgetWarnings,
    budgetOptimizationTips,
    pricingDisclaimer:
      'Fuel math uses real road distance (or corridor estimate when offline), user mileage, and editable petrol price; meals, parking, and entry charges are labeled planning estimates, not live vendor quotes.'
  };
}
