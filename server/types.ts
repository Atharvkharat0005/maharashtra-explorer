export type DivisionName =
  | 'Konkan'
  | 'Pune'
  | 'Nashik'
  | 'Chhatrapati Sambhajinagar'
  | 'Amravati'
  | 'Nagpur';

export type DataSourceType = 'GOVERNMENT' | 'OSM' | 'WIKIMEDIA' | 'MANUAL' | 'OTHER';
export type VerificationStatus = 'AUTO' | 'REVIEW' | 'VERIFIED' | 'REJECTED';

export type AttractionCategory =
  | 'Forts'
  | 'Beaches'
  | 'Hill Stations'
  | 'Waterfalls'
  | 'Caves'
  | 'Temples'
  | 'Wildlife'
  | 'Heritage Places'
  | 'Lakes & Dams'
  | 'Trekking'
  | 'Village Tourism'
  | 'Museums';

export type HiddenGemFilter =
  | 'Hidden Waterfalls'
  | 'Secret Viewpoints'
  | 'Offbeat Forts'
  | 'Unexplored Beaches'
  | 'Village Experiences'
  | 'Lesser-Known Temples'
  | 'Nature Trails'
  | 'Weekend Escapes'
  | 'Photography Locations';

export interface District {
  id: string;
  code: number;
  name: string;
  aliases: string[];
  division: DivisionName;
  headquarters: string;
  talukas: string[];
  keyTowns: string[];
  lat: number;
  lng: number;
  overview: string;
  bestSeason: string;
  majorRailwayStations: string[];
  majorBusHubs: string[];
  nearestAirport: string;
  famousFor: string[];
  source: DataSourceType;
  verificationStatus: VerificationStatus;
}

export interface ImageAttribution {
  url: string;
  thumbnailUrl?: string;
  title: string;
  source: string;
  creator: string;
  license: string;
  originalUrl: string;
  verified: boolean;
}

export interface Attraction {
  id: number;
  slug: string;
  name: string;
  category: AttractionCategory;
  division: DivisionName;
  districtId: string;
  districtName: string;
  taluka?: string;
  locality: string;
  lat: number;
  lng: number;
  description: string;
  whyRecommended: string;
  budget: number; // baseline per-person daily estimate in INR
  duration: number; // recommended days
  recommendedHours: string;
  rating: number;
  bestTime: string;
  suitableSeasons: ('Monsoon' | 'Winter' | 'Summer' | 'Post-Monsoon' | 'Year-Round')[];
  entryFeeInfo: string;
  openingHoursInfo: string;
  accessibilityInfo: string;
  safetyNotes: string;
  popularAttractions: string[];
  thingsToDo: string[];
  travelTips: string[];
  nearbyDestinations: string[];
  tags: string[];
  isHiddenGem: boolean;
  hiddenGemFilters?: HiddenGemFilter[];
  environmentalSensitivity?: string;
  permitRequired?: boolean;
  wikiTitle: string;
  fallbackImageQuery?: string;
  source: DataSourceType;
  verificationStatus: VerificationStatus;
}

export interface HotelListing {
  id: string;
  name: string;
  districtId: string;
  location: string;
  propertyType: 'MTDC Resort' | 'Heritage Stay' | 'Eco Lodge' | 'Boutique Hotel' | 'Homestay' | 'Resort';
  priceMin: number;
  priceMax: number;
  priceNote: string;
  amenities: string[];
  rating?: number;
  ratingSource?: string;
  bookingUrl: string;
  bookingProvider: string;
  wikiTitle?: string;
  verificationStatus: VerificationStatus;
}

export interface RestaurantListing {
  id: string;
  name: string;
  districtId: string;
  location: string;
  cuisine: string;
  specialtyDishes: string[];
  priceRange: string;
  avgMealCostPerPerson: number;
  openingHoursInfo: string;
  dietaryTags: ('Veg' | 'Non-Veg' | 'Jain Friendly' | 'Seafood' | 'Maharashtrian')[];
  verificationStatus: VerificationStatus;
}

export interface TransportGuide {
  id: string;
  mode: 'Train' | 'Bus (MSRTC)' | 'Private Car / Cab' | 'Self-Drive' | 'Ferry / Ro-Ro' | 'Local Auto / Rickshaw';
  fromHub: string;
  toDistrictId: string;
  routeSummary: string;
  approxCostNote: string;
  bookingProvider: string;
  bookingUrl: string;
}

export interface EnRouteHiddenGem {
  id: number;
  name: string;
  category: string;
  districtName: string;
  taluka?: string;
  lat: number;
  lng: number;
  wikiTitle: string;
  detourKm: number;
  additionalMinutes: number;
  recommendedVisitDuration: string;
  entryFeeInfo: string;
  bestTime: string;
  accessibilityInfo: string;
  safetyNotes: string;
  whyWorthVisiting: string;
  worthDetour: boolean;
  isHiddenGem: boolean;
}

export interface RouteComparisonOption {
  id: 'fastest' | 'shortest' | 'scenic' | 'budget' | 'adventure';
  label: string;
  routeSummary: string;
  distanceKm: number;
  durationLabel: string;
  tollEstimateInr: number;
  fuelEstimateInr: number;
  scenicHighlights: string[];
  safetyAdvisory: string;
  suitabilityNote: string;
  dataSource: string;
  geometry: Array<[number, number]>;
}

export interface TransportComparisonOption {
  mode: 'Bike / Motorcycle' | 'Train' | 'Bus (MSRTC)' | 'Private Car / Taxi' | 'Local Transport';
  provider: string;
  originHub: string;
  destinationHub: string;
  estimatedDuration: string;
  approxGroupCostInr: number;
  approxPerPersonInr: number;
  pricingBasis: 'Published / Regional Estimate' | 'OSRM Fuel & Toll Estimate';
  comfortScore: string;
  suitabilityNote: string;
  bookingUrl: string;
  availabilityNotice: string;
}

export type BookingStatus =
  | 'Recommended'
  | 'Selected'
  | 'Booking Initiated'
  | 'Booking Confirmed'
  | 'Cancelled';

export interface TripBookingItem {
  id: string;
  type: 'Transport' | 'Accommodation' | 'Activity' | 'Restaurant' | 'Permit';
  title: string;
  provider: string;
  status: BookingStatus;
  referenceCode?: string;
  estimatedCostInr?: number;
  bookingUrl?: string;
  notes?: string;
  updatedAt: string;
}

export type PreferredTransportMode =
  | 'Bike / Motorcycle'
  | 'Car'
  | 'Public transport'
  | 'Bus'
  | 'Train'
  | 'Walking'
  | 'Car / Taxi'
  | 'Bus (MSRTC)'
  | 'Self-Drive'
  | 'Mixed / Best Fit';

export interface TripPlanInput {
  tripType?: 'one-day' | 'multi-day';
  startingLocation: string;
  startingLat?: number;
  startingLng?: number;
  destinationPreference?: string; // district, attraction name, or "AI_RECOMMEND"
  startDate: string;
  returnDate?: string;
  days: number;
  totalGroupBudget: number; // TOTAL budget for the entire group
  adults: number;
  children: number;
  seniors: number;
  rooms: number;
  preferredTransport: PreferredTransportMode;
  bikeMileageKmPerL?: number;
  petrolPricePerLitre?: number;
  sightseeingExtraKm?: number;
  interests: string[];
  accommodationPreference: 'Budget / Homestay' | 'Standard Hotel / MTDC' | 'Premium Resort' | 'Luxury Heritage' | 'None (Same-Day Return)';
  foodPreference: 'Local Maharashtrian' | 'Pure Veg / Jain' | 'Seafood & Non-Veg' | 'Mixed';
  adventureLevel: 'Relaxed' | 'Moderate' | 'High Adventure / Trekking';
  accessibilityNeeds: string;
  travelStyle: 'budget' | 'standard' | 'premium' | 'luxury';
  language?: 'English' | 'Hindi' | 'Marathi';
  discoverAlongRoute?: boolean;
  naturalLanguagePrompt?: string;
}

export interface FuelCalculationDetails {
  applicable: boolean;
  vehicleMode: 'Bike / Motorcycle' | 'Car';
  oneWayRoadKm: number;
  roundTripBaseKm: number;
  sightseeingDetourKm: number;
  totalDistanceKm: number;
  mileageKmPerLitre: number;
  petrolPricePerLitre: number;
  fuelRequiredLitres: number;
  fuelCostInr: number;
  distanceSource: string;
  priceSource: string;
  formulaSummary: string;
}

export interface BudgetBreakdown {
  tripType: 'one-day' | 'multi-day';
  totalGroupBudget: number;
  groupSize: number;
  adults: number;
  children: number;
  seniors: number;
  rooms: number;
  days: number;
  categories: {
    transportation: number;
    fuelCost: number;
    accommodation: number;
    foodAndBeverages: number;
    entryFees: number;
    activities: number;
    localTransportation: number;
    parkingAndTolls: number;
    miscellaneous: number;
    emergencyReserve: number;
  };
  fuelCalculation?: FuelCalculationDetails;
  optionalExpenses: Array<{ label: string; estimatedCostInr: number; note: string }>;
  estimatedTotalCost: number;
  perPersonCost: number;
  costPerDay: number;
  remainingBudget: number;
  isOverBudget: boolean;
  overBudgetBy: number;
  budgetFeasibility: 'COMFORTABLE' | 'TIGHT_FIT' | 'INSUFFICIENT';
  budgetWarnings: string[];
  budgetOptimizationTips: string[];
  pricingDisclaimer: string;
}

export interface SavedTripRecord {
  id: string;
  userId: number;
  title: string;
  status: 'upcoming' | 'draft' | 'completed';
  startingLocation: string;
  startDate: string;
  days: number;
  totalGroupBudget: number;
  groupSize: number;
  destinations: string[];
  itinerary: any;
  expensesLogged: Array<{
    id: string;
    category: string;
    description: string;
    amount: number;
    date: string;
  }>;
  bookings?: TripBookingItem[];
  createdAt: string;
  updatedAt: string;
}
