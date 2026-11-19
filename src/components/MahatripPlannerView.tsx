import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bike,
  BookmarkCheck,
  Building2,
  Bus,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CloudSun,
  Compass,
  Download,
  Edit3,
  ExternalLink,
  Fuel,
  Heart,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  Sparkles,
  Ticket,
  Train,
  Utensils,
  Wallet,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../services/apiClient';
import {
  Attraction,
  BudgetBreakdown,
  District,
  EnRouteHiddenGem,
  HotelListing,
  NearbyOsmPlace,
  PreferredTransportMode,
  RouteComparisonOption,
  TransportComparisonOption,
  TravelAgent,
  TripBookingItem,
  TripPlanInput
} from '../types';
import { LeafletMap, MapMarker } from './LeafletMap';
import { VerifiedWikiImage } from './VerifiedWikiImage';

const INTEREST_OPTIONS = [
  'Forts and history',
  'Beaches',
  'Hill stations',
  'Waterfalls',
  'Trekking',
  'Wildlife',
  'Temples',
  'Lakes & dams',
  'Scenic roads',
  'Food tourism',
  'Offbeat / Hidden Gems'
];

const ONE_DAY_BIKE_PROMPT =
  'Plan a one-day bike trip from Pune to Lonavala for 2 people within ₹2,000 total budget. Bike mileage 45 km/l, scenic ghat roads and affordable local food.';

const MULTI_DAY_KONKAN_PROMPT =
  'Plan a 4-day trip from Pune to Konkan for 4 people within ₹25,000. We like beaches, forts, scenic roads, local food and hidden places.';

function addDaysIso(startIso: string, days: number): string {
  const d = startIso ? new Date(startIso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Math.max(0, days - 1));
  return d.toISOString().split('T')[0];
}

interface MahatripPlannerViewProps {
  destinations: Attraction[];
  districts?: District[];
  agents: TravelAgent[];
  preselectedDestination: Attraction | null;
  preselectedDistrictName: string | null;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onActiveItineraryChange: (itinerary: any | null) => void;
  onOpenAgentContact: (agent: TravelAgent, pkg?: string) => void;
  onToast: (msg: string, type?: 'success' | 'danger' | 'info') => void;
  initialDraftTrip?: any | null;
  onTripSaved?: () => void;
}

export const MahatripPlannerView: React.FC<MahatripPlannerViewProps> = ({
  destinations,
  districts = [],
  agents,
  preselectedDestination,
  preselectedDistrictName,
  isAuthenticated,
  onRequireAuth,
  onActiveItineraryChange,
  onOpenAgentContact,
  onToast,
  initialDraftTrip,
  onTripSaved
}) => {
  const { t } = useLanguage();
  const defaultStart = new Date(Date.now() + 3 * 86400_000).toISOString().split('T')[0];
  const [form, setForm] = useState<TripPlanInput>({
    tripType: 'one-day',
    startingLocation: 'Pune',
    destinationPreference: preselectedDestination
      ? preselectedDestination.name
      : preselectedDistrictName || '',
    startDate: defaultStart,
    returnDate: defaultStart,
    days: 1,
    totalGroupBudget: 2000,
    adults: 2,
    children: 0,
    seniors: 0,
    rooms: 0,
    preferredTransport: 'Bike / Motorcycle',
    bikeMileageKmPerL: 45,
    petrolPricePerLitre: 105,
    interests: ['Hill stations', 'Scenic roads', 'Lakes & dams', 'Food tourism'],
    accommodationPreference: 'None (Same-Day Return)',
    foodPreference: 'Local Maharashtrian',
    adventureLevel: 'Moderate',
    accessibilityNeeds: '',
    travelStyle: 'budget',
    language: 'English',
    discoverAlongRoute: true
  });

  const [showMoreGroupOptions, setShowMoreGroupOptions] = useState(false);
  const [showNlHelper, setShowNlHelper] = useState(false);
  const [nlPrompt, setNlPrompt] = useState('');
  const [parsingPrompt, setParsingPrompt] = useState(false);
  const [missingQuestions, setMissingQuestions] = useState<string[]>([]);

  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [plan, setPlan] = useState<any | null>(initialDraftTrip?.itinerary || null);
  const [resultTab, setResultTab] = useState<'itinerary' | 'budget' | 'transport'>('itinerary');

  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);
  const [dayFeedbackMap, setDayFeedbackMap] = useState<Record<number, string>>({});
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [openTweakDay, setOpenTweakDay] = useState<number | null>(null);
  const [liveBudgetPreview, setLiveBudgetPreview] = useState<BudgetBreakdown | null>(null);

  // Interactive selections on generated plan
  const [activeRouteId, setActiveRouteId] = useState<'fastest' | 'shortest' | 'scenic' | 'budget' | 'adventure'>('scenic');
  const [excludedGemIds, setExcludedGemIds] = useState<number[]>([]);
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [stayRemoved, setStayRemoved] = useState(false);
  const [selectedTransportMode, setSelectedTransportMode] = useState<string | null>(null);

  // District fetching and location finding state
  const [districtsList, setDistrictsList] = useState<District[]>(districts || []);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);
  const [selectedStartDistrictId, setSelectedStartDistrictId] = useState<string>('pune');
  const [startLocationInput, setStartLocationInput] = useState<string>(form.startingLocation || 'Pune');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState<boolean>(false);
  const [selectedDestDistrictFilter, setSelectedDestDistrictFilter] = useState<string>('All');
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const destDropdownRef = useRef<HTMLDivElement>(null);

  const fetchDistricts = async () => {
    setFetchingDistricts(true);
    try {
      const res = await apiClient.getDistricts();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setDistrictsList(res.data);
      }
    } catch (err: any) {
      console.warn('Could not fetch districts list:', err);
    } finally {
      setFetchingDistricts(false);
    }
  };

  useEffect(() => {
    if (districts && districts.length > 0) {
      setDistrictsList(districts);
    } else {
      fetchDistricts();
    }
  }, [districts]);

  // Sync selectedStartDistrictId with form.startingLocation
  useEffect(() => {
    if (!form.startingLocation || districtsList.length === 0) return;
    const lower = form.startingLocation.toLowerCase();
    const matched = districtsList.find(
      (d) =>
        lower.includes(d.name.toLowerCase()) ||
        lower.includes(d.headquarters.toLowerCase()) ||
        d.aliases.some((a) => lower.includes(a.toLowerCase()))
    );
    if (matched && matched.id !== selectedStartDistrictId) {
      setSelectedStartDistrictId(matched.id);
    }
    setStartLocationInput(form.startingLocation);
  }, [form.startingLocation, districtsList]);

  // Click outside to close location & destination suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setShowLocationSuggestions(false);
      }
      if (destDropdownRef.current && !destDropdownRef.current.contains(e.target as Node)) {
        setShowDestSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedStartDistrict = useMemo(() => {
    if (!districtsList || districtsList.length === 0) return null;
    return (
      districtsList.find(
        (d) =>
          d.id.toLowerCase() === selectedStartDistrictId.toLowerCase() ||
          d.name.toLowerCase() === selectedStartDistrictId.toLowerCase()
      ) || districtsList[0]
    );
  }, [districtsList, selectedStartDistrictId]);

  const availableDistrictLocations = useMemo(() => {
    if (!selectedStartDistrict) return [];
    const list: Array<{ name: string; type: string }> = [];
    const seen = new Set<string>();

    const addLoc = (name: string, type: string) => {
      const trimmed = name.trim();
      const key = trimmed.toLowerCase();
      if (!trimmed || seen.has(key)) return;
      seen.add(key);
      list.push({ name: trimmed, type });
    };

    if (selectedStartDistrict.headquarters) {
      addLoc(selectedStartDistrict.headquarters, 'Headquarters / Main City');
    }
    if (selectedStartDistrict.name) {
      addLoc(selectedStartDistrict.name, 'District Center');
    }

    (selectedStartDistrict.keyTowns || []).forEach((town) => {
      addLoc(town, 'Town / City');
    });

    (selectedStartDistrict.talukas || []).forEach((taluka) => {
      addLoc(`${taluka} (Taluka)`, 'Taluka');
    });

    (selectedStartDistrict.majorRailwayStations || []).forEach((stn) => {
      addLoc(stn, 'Railway Station');
    });

    (selectedStartDistrict.majorBusHubs || []).forEach((hub) => {
      addLoc(hub, 'Bus Stand');
    });

    destinations
      .filter(
        (a) =>
          a.districtId.toLowerCase() === selectedStartDistrict.id.toLowerCase() ||
          a.districtName.toLowerCase() === selectedStartDistrict.name.toLowerCase()
      )
      .slice(0, 12)
      .forEach((a) => {
        addLoc(a.name, a.category || 'Attraction');
      });

    return list;
  }, [selectedStartDistrict, destinations]);

  const filteredLocations = useMemo(() => {
    const q = startLocationInput.trim().toLowerCase();
    if (!q) {
      return availableDistrictLocations.slice(0, 10);
    }
    return availableDistrictLocations
      .filter((loc) => loc.name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [availableDistrictLocations, startLocationInput]);

  const handleStartDistrictChange = (districtId: string) => {
    setSelectedStartDistrictId(districtId);
    const dist = districtsList.find((d) => d.id === districtId);
    const defaultLoc = dist ? dist.name : 'Pune';
    setStartLocationInput(defaultLoc);
    setForm((prev) => ({
      ...prev,
      startingLocation: defaultLoc
    }));
    setShowLocationSuggestions(false);
  };

  const handleSelectLocation = (locName: string) => {
    const cleanName = locName.replace(/\s*\(Taluka\)\s*/i, '');
    const districtName = selectedStartDistrict?.name || '';
    const formatted =
      cleanName.toLowerCase() === districtName.toLowerCase() ||
      cleanName.toLowerCase().includes(districtName.toLowerCase())
        ? cleanName
        : `${cleanName}, ${districtName}`;

    setStartLocationInput(cleanName);
    setForm((prev) => ({
      ...prev,
      startingLocation: formatted
    }));
    setShowLocationSuggestions(false);
  };

  const handleLocationInputChange = (value: string) => {
    setStartLocationInput(value);
    setForm((prev) => ({
      ...prev,
      startingLocation: value
    }));
    setShowLocationSuggestions(true);
  };

  const filteredDestSuggestions = useMemo(() => {
    const q = (form.destinationPreference || '').trim().toLowerCase();
    if (!q) {
      return destinations.slice(0, 12);
    }
    return destinations
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.districtName.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          (d.taluka && d.taluka.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [destinations, form.destinationPreference]);

  const handleSelectDestination = (destName: string) => {
    setForm((prev) => ({ ...prev, destinationPreference: destName }));
    setShowDestSuggestions(false);
  };

  const filteredDestinationsForList = useMemo(() => {
    if (selectedDestDistrictFilter === 'All') return destinations;
    return destinations.filter(
      (d) => d.districtName.toLowerCase() === selectedDestDistrictFilter.toLowerCase()
    );
  }, [destinations, selectedDestDistrictFilter]);

  const isOneDayMode = form.tripType === 'one-day' || form.days <= 1;
  const isBikeMode = form.preferredTransport === 'Bike / Motorcycle';
  const isFuelVehicle =
    isBikeMode || form.preferredTransport === 'Car' || form.preferredTransport === 'Self-Drive';

  useEffect(() => {
    if (preselectedDestination) {
      const oneDay = (preselectedDestination.duration || 1) <= 1;
      setForm((prev) => ({
        ...prev,
        tripType: oneDay ? 'one-day' : 'multi-day',
        destinationPreference: preselectedDestination.name,
        days: oneDay ? 1 : Math.max(2, preselectedDestination.duration || 2),
        rooms: oneDay ? 0 : Math.max(1, Math.ceil((prev.adults + prev.seniors) / 2)),
        accommodationPreference: oneDay ? 'None (Same-Day Return)' : 'Standard Hotel / MTDC'
      }));
    }
  }, [preselectedDestination]);

  useEffect(() => {
    if (preselectedDistrictName) {
      setForm((prev) => ({ ...prev, destinationPreference: preselectedDistrictName }));
    }
  }, [preselectedDistrictName]);

  useEffect(() => {
    if (initialDraftTrip?.itinerary) {
      setPlan(initialDraftTrip.itinerary);
      onActiveItineraryChange(initialDraftTrip.itinerary);
    }
  }, [initialDraftTrip]);

  // Live deterministic budget preview
  useEffect(() => {
    const t = setTimeout(() => {
      apiClient
        .calculateBudget(form)
        .then((res) => setLiveBudgetPreview(res?.data || null))
        .catch(() => {});
    }, 220);
    return () => clearTimeout(t);
  }, [
    form.tripType,
    form.startingLocation,
    form.destinationPreference,
    form.days,
    form.totalGroupBudget,
    form.adults,
    form.children,
    form.seniors,
    form.rooms,
    form.preferredTransport,
    form.bikeMileageKmPerL,
    form.petrolPricePerLitre,
    form.accommodationPreference,
    form.travelStyle
  ]);

  const groupSize = form.adults + form.children + form.seniors;

  const switchTripType = (nextType: 'one-day' | 'multi-day') => {
    if (nextType === 'one-day') {
      setForm((prev) => ({
        ...prev,
        tripType: 'one-day',
        days: 1,
        returnDate: prev.startDate,
        rooms: 0,
        accommodationPreference: 'None (Same-Day Return)'
      }));
    } else {
      const nextDays = Math.max(2, form.days || 3);
      setForm((prev) => ({
        ...prev,
        tripType: 'multi-day',
        days: nextDays,
        returnDate: addDaysIso(prev.startDate, nextDays),
        rooms: Math.max(1, Math.ceil(groupSize / 2)),
        accommodationPreference:
          prev.accommodationPreference === 'None (Same-Day Return)'
            ? 'Standard Hotel / MTDC'
            : prev.accommodationPreference,
        totalGroupBudget: prev.totalGroupBudget < 4000 ? 12000 : prev.totalGroupBudget
      }));
    }
  };

  const handleTransportChange = (mode: PreferredTransportMode) => {
    setForm((prev) => ({
      ...prev,
      preferredTransport: mode,
      bikeMileageKmPerL:
        mode === 'Bike / Motorcycle'
          ? prev.bikeMileageKmPerL && prev.bikeMileageKmPerL >= 25
            ? prev.bikeMileageKmPerL
            : 45
          : mode === 'Car' || mode === 'Self-Drive'
          ? 15
          : prev.bikeMileageKmPerL
    }));
  };

  const toggleInterest = (item: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(item)
        ? prev.interests.filter((x) => x !== item)
        : [...prev.interests, item]
    }));
  };

  const handleLoadRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await apiClient.getRecommendations(form);
      setRecommendations(res?.data || []);
    } catch (err: any) {
      onToast(err?.message || 'Could not rank destinations.', 'danger');
    } finally {
      setLoadingRecs(false);
    }
  };

  const applyParsedPrompt = (parsed: any) => {
    const detectedOneDay =
      parsed.tripType === 'one-day' || Number(parsed.days || 1) <= 1;
    const nextDays = detectedOneDay ? 1 : Math.max(2, Math.min(10, Number(parsed.days || 3)));
    const nextTransport: PreferredTransportMode = parsed.preferredTransport || form.preferredTransport;

    setForm((prev) => ({
      ...prev,
      tripType: detectedOneDay ? 'one-day' : 'multi-day',
      startingLocation: parsed.startingLocation || prev.startingLocation,
      destinationPreference: parsed.destinationPreference || prev.destinationPreference,
      days: nextDays,
      returnDate: addDaysIso(prev.startDate, nextDays),
      adults: Math.max(1, Number(parsed.adults || prev.adults)),
      children: Math.max(0, Number(parsed.children ?? prev.children)),
      seniors: Math.max(0, Number(parsed.seniors ?? prev.seniors)),
      rooms: detectedOneDay
        ? 0
        : Math.max(1, Number(parsed.rooms || Math.ceil(Number(parsed.adults || prev.adults) / 2))),
      totalGroupBudget: Math.max(100, Number(parsed.totalGroupBudget || prev.totalGroupBudget)),
      preferredTransport: nextTransport,
      bikeMileageKmPerL: Number(parsed.bikeMileageKmPerL || prev.bikeMileageKmPerL || 45),
      foodPreference: parsed.foodPreference || prev.foodPreference,
      accommodationPreference: detectedOneDay
        ? 'None (Same-Day Return)'
        : parsed.accommodationPreference || 'Standard Hotel / MTDC',
      adventureLevel: parsed.adventureLevel || prev.adventureLevel,
      interests: Array.isArray(parsed.interests) && parsed.interests.length > 0 ? parsed.interests : prev.interests,
      discoverAlongRoute: typeof parsed.discoverAlongRoute === 'boolean' ? parsed.discoverAlongRoute : true,
      naturalLanguagePrompt: nlPrompt
    }));
    setMissingQuestions(Array.isArray(parsed.missingQuestions) ? parsed.missingQuestions : []);
  };

  const handleParseAndGenerate = async (autoGenerate: boolean) => {
    if (!nlPrompt.trim()) {
      onToast('Write a trip description or click one of the quick examples.', 'info');
      return;
    }
    setParsingPrompt(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.parseTripPrompt(nlPrompt);
      const parsed = res?.data;
      if (parsed) {
        applyParsedPrompt(parsed);
        onToast('MAHATRIP AI understood your trip request!', 'success');

        if (autoGenerate) {
          setGenerating(true);
          const detectedOneDay = parsed.tripType === 'one-day' || Number(parsed.days || 1) <= 1;
          const nextDays = detectedOneDay ? 1 : Math.max(2, Math.min(10, Number(parsed.days || 3)));
          const payload: TripPlanInput = {
            ...form,
            tripType: detectedOneDay ? 'one-day' : 'multi-day',
            startingLocation: parsed.startingLocation || form.startingLocation,
            destinationPreference: parsed.destinationPreference || form.destinationPreference,
            days: nextDays,
            returnDate: addDaysIso(form.startDate, nextDays),
            adults: Math.max(1, Number(parsed.adults || form.adults)),
            children: Math.max(0, Number(parsed.children ?? form.children)),
            seniors: Math.max(0, Number(parsed.seniors ?? form.seniors)),
            rooms: detectedOneDay ? 0 : Math.max(1, Number(parsed.rooms || 1)),
            totalGroupBudget: Math.max(100, Number(parsed.totalGroupBudget || form.totalGroupBudget)),
            preferredTransport: parsed.preferredTransport || form.preferredTransport,
            bikeMileageKmPerL: Number(parsed.bikeMileageKmPerL || form.bikeMileageKmPerL || 45),
            accommodationPreference: detectedOneDay
              ? 'None (Same-Day Return)'
              : parsed.accommodationPreference || form.accommodationPreference,
            interests:
              Array.isArray(parsed.interests) && parsed.interests.length > 0
                ? parsed.interests
                : form.interests,
            discoverAlongRoute: true,
            naturalLanguagePrompt: nlPrompt
          };
          const planRes = await apiClient.generateAiItinerary(payload);
          setPlan(planRes.data);
          setResultTab('itinerary');
          setExcludedGemIds([]);
          setSelectedStayId(planRes.data?.hotelAlternatives?.[0]?.id || null);
          setStayRemoved(detectedOneDay);
          setActiveRouteId(payload.discoverAlongRoute ? 'scenic' : 'fastest');
          onActiveItineraryChange(planRes.data);
          onToast('Trip itinerary generated!', 'success');
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Unable to process natural language request.';
      setErrorMsg(msg);
      onToast(msg, 'danger');
    } finally {
      setParsingPrompt(false);
      setGenerating(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setGenerating(true);
    try {
      const payload: TripPlanInput = {
        ...form,
        days: isOneDayMode ? 1 : form.days,
        rooms: isOneDayMode ? 0 : form.rooms,
        returnDate: isOneDayMode ? form.startDate : form.returnDate,
        accommodationPreference: isOneDayMode ? 'None (Same-Day Return)' : form.accommodationPreference
      };
      const res = await apiClient.generateAiItinerary(payload);
      setPlan(res.data);
      setResultTab('itinerary');
      setExcludedGemIds([]);
      setSelectedStayId(res.data?.hotelAlternatives?.[0]?.id || null);
      setStayRemoved(isOneDayMode);
      setActiveRouteId(payload.discoverAlongRoute ? 'scenic' : 'fastest');
      onActiveItineraryChange(res.data);
      onToast(
        isOneDayMode
          ? 'One-Day Same-Day Return itinerary generated!'
          : 'Complete Maharashtra group itinerary generated!',
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Unable to generate itinerary.';
      setErrorMsg(msg);
      onToast(msg, 'danger');
    } finally {
      setGenerating(false);
    }
  };

  const handleReplanWithAlternative = async (altName: string) => {
    const nextForm: TripPlanInput = {
      ...form,
      destinationPreference: altName
    };
    setForm(nextForm);
    setGenerating(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.generateAiItinerary(nextForm);
      setPlan(res.data);
      setResultTab('itinerary');
      onActiveItineraryChange(res.data);
      onToast(`Re-planned trip for ${altName}!`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'Re-planning failed.', 'danger');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateDay = async (dayNumber: number) => {
    if (!plan) return;
    setRegeneratingDay(dayNumber);
    try {
      const res = await apiClient.regenerateDay({
        dayNumber,
        currentItinerary: plan,
        feedback: dayFeedbackMap[dayNumber] || 'Refresh activities with better pacing and nearby food stops.',
        language: form.language
      });
      const updatedDays = (plan.days || []).map((d: any) => (d.dayNumber === dayNumber ? res.data : d));
      const updatedPlan = { ...plan, days: updatedDays };
      setPlan(updatedPlan);
      onActiveItineraryChange(updatedPlan);
      onToast(`Day ${dayNumber} refreshed by MAHATRIP AI`, 'success');
    } catch (err: any) {
      onToast(err?.message || 'Could not regenerate day.', 'danger');
    } finally {
      setRegeneratingDay(null);
    }
  };

  const handleUpdateDayField = (dayNumber: number, field: string, value: string) => {
    if (!plan) return;
    const updatedDays = (plan.days || []).map((d: any) =>
      d.dayNumber === dayNumber ? { ...d, [field]: value } : d
    );
    const updatedPlan = { ...plan, days: updatedDays };
    setPlan(updatedPlan);
    onActiveItineraryChange(updatedPlan);
  };

  const buildInitialBookings = (): TripBookingItem[] => {
    if (!plan) return [];
    const now = new Date().toISOString();
    const list: TripBookingItem[] = [];

    const transportList: TransportComparisonOption[] = plan.transportComparison || [];
    const chosenTransport =
      transportList.find((t) => t.mode === selectedTransportMode) || transportList[0];
    if (chosenTransport) {
      list.push({
        id: 'BKG-TRN-' + Math.floor(100 + Math.random() * 899),
        type: 'Transport',
        title: `${chosenTransport.mode}: ${chosenTransport.originHub} → ${chosenTransport.destinationHub}`,
        provider: chosenTransport.provider,
        status: selectedTransportMode ? 'Selected' : 'Recommended',
        estimatedCostInr: chosenTransport.approxGroupCostInr,
        bookingUrl: chosenTransport.bookingUrl,
        notes: chosenTransport.availabilityNotice,
        updatedAt: now
      });
    }

    const planIsOneDay = plan?.sameDaySummary?.isOneDayTrip === true;
    const stays: HotelListing[] = plan.hotelAlternatives || [];
    const chosenStay = !planIsOneDay && !stayRemoved ? stays.find((s) => s.id === selectedStayId) || stays[0] : null;
    if (chosenStay) {
      list.push({
        id: 'BKG-HTL-' + Math.floor(100 + Math.random() * 899),
        type: 'Accommodation',
        title: `${chosenStay.name} (${form.rooms} room(s) · ${Math.max(1, form.days - 1)} night(s))`,
        provider: chosenStay.bookingProvider,
        status: selectedStayId ? 'Selected' : 'Recommended',
        estimatedCostInr:
          Math.round((chosenStay.priceMin + chosenStay.priceMax) / 2) *
          Math.max(1, form.rooms) *
          Math.max(1, form.days - 1),
        bookingUrl: chosenStay.bookingUrl,
        notes: chosenStay.priceNote,
        updatedAt: now
      });
    }

    return list;
  };

  const handleSaveTrip = async (status: 'upcoming' | 'draft') => {
    if (!plan) return;
    if (!isAuthenticated) {
      onToast('Please sign in to save trips to your account.', 'info');
      onRequireAuth();
      return;
    }
    try {
      const primaryNames = (plan.destinationRecommendations || []).map((r: any) => r.name);
      const isPlanOneDay = plan?.sameDaySummary?.isOneDayTrip === true;
      await apiClient.saveTrip({
        title: isPlanOneDay
          ? `1-Day Return: ${form.startingLocation} → ${primaryNames[0] || form.destinationPreference}`
          : `${form.days}-Day ${primaryNames[0] || form.destinationPreference} Trip`,
        status,
        startingLocation: form.startingLocation,
        startDate: form.startDate,
        days: isPlanOneDay ? 1 : form.days,
        totalGroupBudget: form.totalGroupBudget,
        groupSize,
        destinations: primaryNames,
        itinerary: plan,
        bookings: buildInitialBookings()
      });
      onTripSaved?.();
      onToast(
        status === 'draft'
          ? 'Draft saved to My Trips.'
          : 'Trip & budget checklist saved to My Trips!',
        'success'
      );
    } catch (err: any) {
      onToast(err?.message || 'Failed to save trip.', 'danger');
    }
  };

  const handleDownloadJson = () => {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mahatrip-itinerary-${form.startDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const budget: BudgetBreakdown | null = plan?.expenses || liveBudgetPreview;
  const planIsOneDay = plan?.sameDaySummary?.isOneDayTrip === true;

  const routeOptions: RouteComparisonOption[] = plan?.routeOptions || [];
  const activeRoute =
    routeOptions.find((r) => r.id === activeRouteId) || routeOptions[0] || null;
  const enRouteGems: EnRouteHiddenGem[] = plan?.enRouteHiddenGems || [];
  const includedEnRouteGems = enRouteGems.filter((g) => !excludedGemIds.includes(g.id));
  const fuelStations: NearbyOsmPlace[] = plan?.fuelStations || [];
  const hotelAlternatives: HotelListing[] = planIsOneDay ? [] : plan?.hotelAlternatives || [];
  const activeStay = !planIsOneDay && !stayRemoved
    ? hotelAlternatives.find((h) => h.id === selectedStayId) || hotelAlternatives[0] || null
    : null;

  const mapMarkers: MapMarker[] = [];
  if (plan?.mapContext?.startingPoint) {
    mapMarkers.push({
      id: 'start',
      label: `Start / Return: ${plan.mapContext.startingPoint.name}`,
      lat: plan.mapContext.startingPoint.lat,
      lng: plan.mapContext.startingPoint.lng,
      kind: 'start'
    });
  }
  includedEnRouteGems.forEach((g) => {
    mapMarkers.push({
      id: `gem-${g.id}`,
      label: `En-Route Stop: ${g.name}`,
      sublabel: `+${g.detourKm} km detour · ${g.category}`,
      lat: g.lat,
      lng: g.lng,
      kind: 'hotel'
    });
  });
  (plan?.mapContext?.stops || []).forEach((s: any) => {
    mapMarkers.push({
      id: s.id,
      label: s.name,
      sublabel: `${s.category} · ${s.district}`,
      lat: s.lat,
      lng: s.lng,
      kind: 'attraction'
    });
  });
  fuelStations.slice(0, 4).forEach((f) => {
    mapMarkers.push({
      id: `fuel-${f.id}`,
      label: `Petrol Station: ${f.name}`,
      sublabel: `${f.distanceKm} km from destination`,
      lat: f.lat,
      lng: f.lng,
      kind: 'fuel'
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
            MAHATRIP AI · Practical Maharashtra Trip Planner
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Plan a One-Day Escape or Multi-Day Circuit
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
            Total group budget is treated as your strict ceiling — with transparent bike fuel math,
            same-day return schedules, and honest recommendations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNlHelper((v) => !v)}
          className="px-4 py-2 rounded-xl bg-[#18130f] hover:bg-white/10 border border-orange-500/35 text-xs font-semibold text-amber-300 inline-flex items-center gap-2 self-start cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {showNlHelper ? 'Hide Quick Text Assistant' : 'Describe Trip in Plain Text'}
        </button>
      </div>

      {/* Collapsible Natural Language Input */}
      {showNlHelper && (
        <div className="bg-[#18130f] border border-orange-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Quick Plain-Language Input
            </span>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setNlPrompt(ONE_DAY_BIKE_PROMPT)}
                className="text-amber-300 hover:underline cursor-pointer"
              >
                Example: Pune → Lonavala 1-Day Bike (₹2,000)
              </button>
              <button
                type="button"
                onClick={() => setNlPrompt(MULTI_DAY_KONKAN_PROMPT)}
                className="text-stone-300 hover:text-white hover:underline cursor-pointer"
              >
                Example: 4-Day Pune → Konkan (₹25,000)
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2.5">
            <input
              type="text"
              value={nlPrompt}
              onChange={(e) => setNlPrompt(e.target.value)}
              placeholder='e.g. "One-day bike trip from Pune to Lonavala for 2 people within ₹2,000 total budget, 45 km/l mileage"'
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#110d0a] border border-white/15 text-sm text-white placeholder-stone-400 focus:outline-none focus:border-orange-500"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={parsingPrompt || generating}
                onClick={() => handleParseAndGenerate(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold cursor-pointer"
              >
                {parsingPrompt ? 'Filling...' : 'Auto-Fill Form'}
              </button>
              <button
                type="button"
                disabled={parsingPrompt || generating}
                onClick={() => handleParseAndGenerate(true)}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
              >
                {generating ? 'Planning...' : 'Understand & Plan'}
              </button>
            </div>
          </div>
          {missingQuestions.length > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              {missingQuestions.map((q, i) => (
                <p key={i}>• {q}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT COLUMN: Clean & Practical Form */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-4 bg-[#18130f] p-5 rounded-2xl border border-white/10 space-y-4"
        >
          {/* Dedicated One-Day vs Multi-Day Switch */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
              Trip Duration Type
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#110d0a] border border-white/10">
              <button
                type="button"
                onClick={() => switchTripType('one-day')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isOneDayMode
                    ? 'bg-orange-500 text-white'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                One-Day (Same-Day Return)
              </button>
              <button
                type="button"
                onClick={() => switchTripType('multi-day')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  !isOneDayMode
                    ? 'bg-orange-500 text-white'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Multi-Day Trip
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Compact Starting Location (District + Area/Town) */}
            <div className="bg-[#110d0a] p-3 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span>{t('planner.startingLocation', 'Starting Location')}</span>
                </label>
              </div>

              {/* Compact 2-column input grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1: District Selector */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    {t('planner.district', 'District')}
                  </label>
                  <select
                    value={selectedStartDistrictId}
                    onChange={(e) => handleStartDistrictChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#18130f] border border-white/15 text-xs text-white font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {districtsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.division})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2: Specific Location / Area / Landmark */}
                <div className="relative" ref={locationDropdownRef}>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    {t('planner.areaOrTown', 'Town / Area')}
                  </label>
                  <div className="relative">
                    <Search className="w-3 h-3 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      required
                      type="text"
                      value={startLocationInput}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      onFocus={() => setShowLocationSuggestions(true)}
                      placeholder={`e.g. Swargate, ${selectedStartDistrict?.keyTowns?.[0] || 'Lonavala'}...`}
                      className="w-full pl-7 pr-6 py-1.5 rounded-lg bg-[#18130f] border border-white/15 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
                    />
                    {startLocationInput && (
                      <button
                        type="button"
                        onClick={() => handleLocationInputChange('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showLocationSuggestions && filteredLocations.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-40 max-h-48 overflow-y-auto rounded-lg bg-[#18130f] border border-white/15 shadow-2xl p-1 space-y-0.5">
                      <div className="px-2 py-0.5 text-[9px] uppercase font-bold text-stone-400 flex justify-between items-center border-b border-white/10">
                        <span>{selectedStartDistrict?.name} {t('planner.locations', 'locations')}</span>
                        <button
                          type="button"
                          onClick={() => setShowLocationSuggestions(false)}
                          className="text-stone-400 hover:text-white cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      {filteredLocations.slice(0, 8).map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectLocation(loc.name)}
                          className="w-full px-2 py-1 rounded text-left text-xs text-stone-200 hover:bg-orange-500/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                        >
                          <span className="font-medium truncate">{loc.name}</span>
                          <span className="text-[9px] text-amber-300/80 bg-white/5 px-1.5 py-0.2 rounded shrink-0 ml-1">
                            {loc.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Quick Pick Chips */}
              {availableDistrictLocations.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-stone-400 font-medium">{t('planner.popularSpots', 'Popular')}:</span>
                  {availableDistrictLocations
                    .filter((l) => l.name.replace(/\s*\(Taluka\)\s*/i, '').toLowerCase() !== selectedStartDistrict?.name.toLowerCase())
                    .slice(0, 4)
                    .map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectLocation(loc.name)}
                        className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-orange-500/20 text-stone-300 hover:text-orange-300 border border-white/5 transition cursor-pointer truncate max-w-[130px]"
                      >
                        {loc.name.replace(/\s*\(Taluka\)\s*/i, '')}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Destination Selection with Dropdown */}
            <div className="relative" ref={destDropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-orange-400" />
                  <span>{t('planner.destination', 'Destination')}</span>
                </label>
                {form.destinationPreference && (
                  <span className="text-[11px] text-amber-300 font-medium truncate max-w-[200px]">
                    📍 {form.destinationPreference}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={form.destinationPreference}
                  onChange={(e) => {
                    setForm({ ...form, destinationPreference: e.target.value });
                    setShowDestSuggestions(true);
                  }}
                  onFocus={() => setShowDestSuggestions(true)}
                  placeholder="e.g. Mahabaleshwar, Alibaug, Tadoba (or leave blank to let AI choose)..."
                  className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[#110d0a] border border-white/10 text-sm text-white placeholder:text-stone-500/60 focus:outline-none focus:border-orange-500 transition"
                />
                {form.destinationPreference ? (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, destinationPreference: '' });
                      setShowDestSuggestions(true);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1 cursor-pointer"
                    title="Clear destination"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDestSuggestions(!showDestSuggestions)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1 cursor-pointer"
                    title="Toggle destinations dropdown"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown for Destinations / Locations */}
              {showDestSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-64 overflow-y-auto rounded-xl bg-[#18130f] border border-white/15 shadow-2xl p-1.5 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-stone-400 flex justify-between items-center border-b border-white/10">
                    <span>
                      {form.destinationPreference ? 'Matching Destinations' : 'Popular Maharashtra Destinations'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDestSuggestions(false)}
                      className="text-stone-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Option: Let AI Choose */}
                  <button
                    type="button"
                    onClick={() => handleSelectDestination('')}
                    className="w-full px-2.5 py-2 rounded-lg text-left text-xs text-amber-300 hover:bg-orange-500/20 flex items-center justify-between transition cursor-pointer border border-dashed border-amber-500/30"
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Let AI Recommend Best Destination
                    </span>
                    <span className="text-[10px] text-stone-400">AI Choice</span>
                  </button>

                  {filteredDestSuggestions.length > 0 ? (
                    filteredDestSuggestions.map((dest) => (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => handleSelectDestination(dest.name)}
                        className="w-full px-2.5 py-2 rounded-lg text-left text-xs text-stone-200 hover:bg-orange-500/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold block truncate">{dest.name}</span>
                          <span className="text-[10px] text-stone-400 truncate">
                            {dest.districtName} District {dest.taluka ? `· ${dest.taluka}` : ''}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-300 bg-white/5 px-2 py-0.5 rounded shrink-0 border border-white/10">
                          {dest.category}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-center text-xs text-stone-400">
                      No matching spot found. AI will custom plan for "{form.destinationPreference}".
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Travel Date (+ Return Date / Days ONLY for Multi-Day) */}
          {isOneDayMode ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-200 block mb-1">Travel Date</label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value, returnDate: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-200 block mb-1">
                  Travelers (Group)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.adults}
                  onChange={(e) => setForm({ ...form, adults: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-sm font-bold text-white tabular-nums"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-stone-200 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        startDate: e.target.value,
                        returnDate: addDaysIso(e.target.value, form.days)
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-200 block mb-1">Return Date</label>
                  <input
                    type="date"
                    value={form.returnDate || addDaysIso(form.startDate, form.days)}
                    onChange={(e) => {
                      const s = new Date(form.startDate).getTime();
                      const r = new Date(e.target.value).getTime();
                      const diff = Math.max(2, Math.min(10, Math.round((r - s) / 86400_000) + 1));
                      setForm({
                        ...form,
                        returnDate: e.target.value,
                        days: Number.isNaN(diff) ? form.days : diff
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-200 block mb-1">Days</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={form.days}
                    onChange={(e) => {
                      const d = Math.max(2, Number(e.target.value));
                      setForm({ ...form, days: d, returnDate: addDaysIso(form.startDate, d) });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-xs text-white tabular-nums"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-200 block mb-1">Adults</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.adults}
                    onChange={(e) => setForm({ ...form, adults: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-sm font-bold text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-200 block mb-1">Hotel Rooms</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={Math.max(1, form.rooms)}
                    onChange={(e) => setForm({ ...form, rooms: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-sm font-bold text-white tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Expandable Children / Seniors */}
          <div>
            <button
              type="button"
              onClick={() => setShowMoreGroupOptions((v) => !v)}
              className="text-[11px] text-amber-300 hover:underline cursor-pointer"
            >
              {showMoreGroupOptions
                ? 'Hide children & seniors count'
                : `+ Add children or senior citizens (${form.children} children, ${form.seniors} seniors)`}
            </button>
            {showMoreGroupOptions && (
              <div className="grid grid-cols-2 gap-2.5 mt-2">
                <div>
                  <label className="text-[11px] text-stone-300 block mb-1">Children</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={form.children}
                    onChange={(e) => setForm({ ...form, children: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#110d0a] border border-white/15 text-xs text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-300 block mb-1">Senior Citizens</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={form.seniors}
                    onChange={(e) => setForm({ ...form, seniors: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#110d0a] border border-white/15 text-xs text-white tabular-nums"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Total Group Budget Ceiling */}
          <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/35 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">
                Total Group Budget (All {groupSize})
              </label>
              <span className="text-xs font-bold text-amber-300 tabular-nums">
                ~₹{Math.round(form.totalGroupBudget / Math.max(1, groupSize)).toLocaleString('en-IN')}/person
              </span>
            </div>
            <input
              type="number"
              min={100}
              step={100}
              required
              value={form.totalGroupBudget}
              onChange={(e) => setForm({ ...form, totalGroupBudget: Number(e.target.value) })}
              className="w-full px-3.5 py-2 rounded-lg bg-[#110d0a] border border-orange-500/40 text-sm font-bold text-white tabular-nums"
            />
            <p className="text-[11px] text-stone-300">
              Strict ceiling for the whole group (fuel/tickets, food, entry &amp; buffer combined).
            </p>
          </div>

          {/* Travel Mode + Conditional Bike Mileage Inputs */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-stone-200 block mb-1">Travel Mode</label>
                <select
                  value={form.preferredTransport}
                  onChange={(e) => handleTransportChange(e.target.value as PreferredTransportMode)}
                  className="w-full px-3 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-xs font-semibold text-white"
                >
                  <option value="Bike / Motorcycle">Bike / Motorcycle</option>
                  <option value="Car">Car (Self-Drive)</option>
                  <option value="Public transport">Public Transport</option>
                  <option value="Bus">MSRTC Bus</option>
                  <option value="Train">Train</option>
                  <option value="Walking">Walking</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-200 block mb-1">Food Preference</label>
                <select
                  value={form.foodPreference}
                  onChange={(e) => setForm({ ...form, foodPreference: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-xs font-semibold text-white"
                >
                  <option value="Local Maharashtrian">Local Maharashtrian</option>
                  <option value="Pure Veg / Jain">Pure Veg / Jain</option>
                  <option value="Seafood & Non-Veg">Seafood &amp; Non-Veg</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            </div>

            {isFuelVehicle && (
              <div className="p-3 rounded-xl bg-[#110d0a] border border-amber-500/30 space-y-2">
                <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5" />
                  {isBikeMode ? 'Bike Fuel Calculation Settings' : 'Car Fuel Calculation Settings'}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-stone-300 block mb-1">
                      Mileage (km/L)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={95}
                      value={form.bikeMileageKmPerL || (isBikeMode ? 45 : 15)}
                      onChange={(e) =>
                        setForm({ ...form, bikeMileageKmPerL: Math.max(10, Number(e.target.value)) })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#18130f] border border-white/15 text-xs font-bold text-white tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-300 block mb-1">
                      Petrol (₹/L est.)
                    </label>
                    <input
                      type="number"
                      min={70}
                      max={150}
                      value={form.petrolPricePerLitre || 105}
                      onChange={(e) =>
                        setForm({ ...form, petrolPricePerLitre: Math.max(70, Number(e.target.value)) })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#18130f] border border-white/15 text-xs font-bold text-white tabular-nums"
                    />
                  </div>
                </div>
                {isBikeMode && (
                  <p className="text-[10px] text-stone-400">
                    ₹0 two-wheeler highway toll · Old Highway (NH48) recommended over Expressway.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Multi-day only stay preference */}
          {!isOneDayMode && (
            <div>
              <label className="text-xs font-bold text-stone-200 block mb-1">Stay Type</label>
              <select
                value={form.accommodationPreference}
                onChange={(e) => setForm({ ...form, accommodationPreference: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-[#110d0a] border border-white/15 text-xs font-semibold text-white"
              >
                <option value="Budget / Homestay">Budget / Homestay</option>
                <option value="Standard Hotel / MTDC">Standard Hotel / MTDC</option>
                <option value="Premium Resort">Premium Resort</option>
                <option value="Luxury Heritage">Luxury Heritage</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-stone-200 block mb-1.5">Interests</label>
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_OPTIONS.map((item) => {
                const selected = form.interests.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleInterest(item)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      selected
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#110d0a] text-stone-300 border border-white/10 hover:border-orange-500/40'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff6b1a] to-[#ff8c38] hover:brightness-110 text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Planning your trip...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isOneDayMode ? 'Plan One-Day Return Trip' : 'Generate Complete Trip Plan'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLoadRecommendations}
              disabled={loadingRecs}
              className="w-full py-2.5 rounded-xl bg-[#110d0a] hover:bg-white/10 border border-white/15 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              {loadingRecs ? 'Finding matches...' : 'Find Destinations Within My Budget'}
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: Smart Budget Preview, Recommendations & Tabbed Output */}
        <div className="lg:col-span-8 space-y-5">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-100 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Could not complete AI planning request</p>
                <p className="text-xs mt-0.5 text-red-200">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Ranked Recommendations Within Budget */}
          {recommendations && (
            <div className="bg-[#18130f] rounded-2xl border border-amber-500/30 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  Destinations Ranked for ₹{form.totalGroupBudget.toLocaleString('en-IN')} Group Budget (
                  {isOneDayMode ? 'Same-Day Return' : `${form.days}-Day`})
                </h2>
                <button
                  type="button"
                  onClick={() => setRecommendations(null)}
                  className="text-xs text-stone-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-[#110d0a] border border-white/10 flex flex-col justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-white">{rec.name}</p>
                        <span
                          className={`font-bold tabular-nums shrink-0 ${
                            rec.withinBudget ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          Est. ₹{Number(rec.estimatedGroupCostInr).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-300 mt-0.5 tabular-nums">
                        {rec.districtName} · {rec.roundTripRoadKm} km round trip · ~
                        {rec.estimatedOneWayDuration} one-way
                      </p>
                      <p className="text-[11px] text-stone-300 mt-1">{rec.suitabilitySummary}</p>
                      {isOneDayMode && (
                        <p
                          className={`text-[11px] mt-1 font-semibold ${
                            rec.practicalForOneDay ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {rec.practicalForOneDay
                            ? `Practical 1-Day Window: ${rec.departureReturnWindow}`
                            : 'Better suited for Multi-Day (long distance)'}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReplanWithAlternative(rec.name)}
                      className="py-1.5 px-3 rounded-lg bg-orange-500/20 hover:bg-orange-500 text-amber-200 hover:text-white font-semibold text-[11px] transition cursor-pointer self-start"
                    >
                      Plan Trip Here
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated AI Itinerary OR Empty Ready Prompt */}
          {!plan ? (
            <div className="bg-[#18130f] rounded-2xl border border-white/10 p-10 text-center space-y-3">
              <Compass className="w-10 h-10 text-orange-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Ready to Plan with MAHATRIP AI</h3>
              <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                Select <strong className="text-white">One-Day (Same-Day Return)</strong> or{' '}
                <strong className="text-white">Multi-Day</strong> on the left, enter your total group
                budget, and click Plan to see the complete schedule, OSRM map route, petrol stops,
                and transparent cost breakdown.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Summary + Practicality & Same-Day Departure/Return Bar */}
              <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {planIsOneDay ? '1-Day Round Trip' : `${form.days}-Day Plan`}
                      </span>
                      <span className="text-xs text-stone-300">
                        From &amp; back to <strong className="text-white">{plan.startingLocation}</strong>
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {plan.destinationRecommendations?.[0]?.name || form.destinationPreference}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSaveTrip('draft')}
                      className="px-3.5 py-2 rounded-xl bg-[#110d0a] hover:bg-white/10 border border-white/15 text-stone-200 text-xs font-semibold cursor-pointer transition"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleSaveTrip('upcoming')}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    >
                      <Heart className="w-3.5 h-3.5" /> Save Trip
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      title="Download JSON"
                      className="p-2 rounded-xl bg-[#110d0a] hover:bg-white/10 border border-white/15 text-stone-300 hover:text-white text-xs font-bold flex items-center justify-center cursor-pointer transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Clean Key Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs tabular-nums">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-stone-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-orange-400" /> Departure
                    </span>
                    <span className="font-bold text-white block">
                      {plan.sameDaySummary?.departureTime || '7:00 AM'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-stone-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-emerald-400" /> Return Home
                    </span>
                    <span className="font-bold text-white block">
                      {plan.sameDaySummary?.expectedReturnTime || (planIsOneDay ? 'By 8:30 PM' : `Day ${form.days} Evening`)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-stone-400 flex items-center gap-1 text-[11px]">
                      <Route className="w-3 h-3 text-amber-400" /> Total Distance
                    </span>
                    <span className="font-bold text-white block">
                      {plan.sameDaySummary?.totalRidingOrDrivingKm || Math.round(activeRoute?.distanceKm ? activeRoute.distanceKm * 2 : 140)} km
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-stone-400 flex items-center gap-1 text-[11px]">
                      <Wallet className="w-3 h-3 text-sky-400" /> Total Group Cost
                    </span>
                    <span className="font-bold text-emerald-400 block">
                      ₹{Number(budget?.estimatedTotalCost || plan.estimatedTotalCost || form.totalGroupBudget).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  {plan.tripSummary}
                </p>

                {/* Practicality / Budget Alert */}
                {(plan.sameDaySummary?.isPractical === false || budget?.budgetFeasibility === 'INSUFFICIENT') && (
                  <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-100 space-y-2">
                    <p className="font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> Practicality &amp; Budget Note
                    </p>
                    {plan.sameDaySummary?.isPractical === false && (
                      <p>{plan.sameDaySummary.feasibilityReason}</p>
                    )}
                    {budget?.budgetWarnings?.map((w, i) => (
                      <p key={i}>{w}</p>
                    ))}
                    {Array.isArray(plan.sameDaySummary?.saferCloserAlternatives) &&
                      plan.sameDaySummary.saferCloserAlternatives.length > 0 && (
                        <div className="pt-2 border-t border-rose-500/30">
                          <p className="font-semibold text-white mb-2">Closer Alternatives Within Budget:</p>
                          <div className="flex flex-wrap gap-2">
                            {plan.sameDaySummary.saferCloserAlternatives.map((alt: any) => (
                              <button
                                key={alt.name}
                                type="button"
                                onClick={() => handleReplanWithAlternative(alt.name)}
                                className="px-3 py-1.5 rounded-lg bg-[#110d0a] hover:bg-orange-500 text-stone-100 hover:text-white border border-white/15 text-[11px] font-semibold cursor-pointer transition"
                              >
                                {alt.name} · {alt.roundTripKm} km · Est. ₹
                                {Number(alt.estimatedGroupCostInr).toLocaleString('en-IN')}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Clean Segmented Tabs for Plan Output */}
              <div className="flex gap-2 bg-[#18130f] border border-white/10 p-1.5 rounded-xl text-xs font-bold">
                {[
                  { id: 'itinerary', label: 'Day-by-Day Itinerary & Route', icon: CalendarDays },
                  { id: 'budget', label: 'Budget Breakdown', icon: Wallet },
                  { id: 'transport', label: 'Transport, Food & Practical Tips', icon: Utensils }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setResultTab(tab.id as any)}
                      className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                        resultTab === tab.id
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.id === 'itinerary' ? 'Plan' : tab.id === 'budget' ? 'Budget' : 'Transport'}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: ITINERARY & MAP */}
              {resultTab === 'itinerary' && (
                <div className="space-y-5">
                  {plan.weatherSnapshot && (
                    <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-medium">
                        <CloudSun className="w-4 h-4 text-sky-400 shrink-0" />
                        Live Weather: <strong className="text-white">{plan.weatherSnapshot.current.temperatureC}°C · {plan.weatherSnapshot.current.conditionLabel}</strong>
                        <span className="text-sky-300">({plan.weatherSnapshot.travelAdvisory.suitability})</span>
                      </span>
                      <span className="text-sky-200 text-[11px]">
                        {plan.weatherSnapshot.travelAdvisory.advisories[0]}
                      </span>
                    </div>
                  )}

                  {/* Interactive Route & Map */}
                  {(routeOptions.length > 0 || mapMarkers.length > 0) && (
                    <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Route className="w-4 h-4 text-orange-400" />
                          Scenic Route &amp; Travel Corridor
                        </h3>
                        {activeRoute && (
                          <span className="text-xs font-semibold text-amber-300 tabular-nums">
                            {activeRoute.distanceKm} km one-way · {activeRoute.durationLabel}
                            {activeRoute.tollEstimateInr > 0 ? ` · Toll ~₹${activeRoute.tollEstimateInr}` : ''}
                          </span>
                        )}
                      </div>

                      {routeOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {routeOptions.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => setActiveRouteId(r.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                activeRouteId === r.id
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-[#110d0a] text-stone-200 border border-white/10 hover:border-orange-500/40'
                              }`}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {activeRoute && (
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs space-y-1">
                          <p className="text-stone-200 font-medium">{activeRoute.routeSummary}</p>
                          {activeRoute.safetyAdvisory && (
                            <p className="text-amber-200 flex items-start gap-1.5 text-[11px]">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>{activeRoute.safetyAdvisory}</span>
                            </p>
                          )}
                        </div>
                      )}

                      <LeafletMap
                        markers={mapMarkers}
                        routePolyline={
                          activeRoute?.geometry || plan.mapContext?.osrmRoute?.geometry || []
                        }
                        heightClass="h-64"
                      />
                    </div>
                  )}

                  {/* Day-by-Day Schedule - Professional Timeline Layout */}
                  <div className="space-y-4">
                    {(plan.days || []).map((day: any, idx: number) => {
                      const isEditing = editingDay === day.dayNumber;
                      const isTweakOpen = openTweakDay === day.dayNumber;
                      const isFirst = idx === 0;
                      const isLast = idx === (plan.days?.length || 1) - 1;
                      return (
                        <div
                          key={day.dayNumber}
                          className="bg-[#18130f] rounded-2xl border border-white/10 p-5 sm:p-6 space-y-5"
                        >
                          {/* Day Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-xs shrink-0">
                                D{day.dayNumber}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                                    {planIsOneDay
                                      ? 'Full-Day Exploration'
                                      : `Day ${day.dayNumber}${isFirst ? ' · Outbound Departure' : isLast ? ' · Return Journey' : ''}`}
                                  </span>
                                  {day.baseLocation && (
                                    <span className="text-[11px] text-stone-400">• {day.baseLocation}</span>
                                  )}
                                </div>
                                <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">{day.title}</h4>
                                {day.departureOrCheckinNote && (
                                  <p className="text-xs text-amber-300 mt-0.5">
                                    {day.departureOrCheckinNote}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingDay(isEditing ? null : day.dayNumber)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Done' : 'Edit'}
                              </button>
                              <button
                                onClick={() => setOpenTweakDay(isTweakOpen ? null : day.dayNumber)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                                  isTweakOpen
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300'
                                }`}
                              >
                                Tweak Note
                              </button>
                              <button
                                onClick={() => handleRegenerateDay(day.dayNumber)}
                                disabled={regeneratingDay === day.dayNumber}
                                className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/35 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                              >
                                <RefreshCw
                                  className={`w-3.5 h-3.5 ${
                                    regeneratingDay === day.dayNumber ? 'animate-spin' : ''
                                  }`}
                                />
                                Regenerate
                              </button>
                            </div>
                          </div>

                          {/* Optional Tweak Drawer */}
                          {isTweakOpen && (
                            <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/30 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-amber-300">Tweak instructions for Day {day.dayNumber}</span>
                                <span className="text-[11px] text-stone-400">e.g., "Add a sunset viewpoint", "Prefer light food"</span>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  value={dayFeedbackMap[day.dayNumber] || ''}
                                  onChange={(e) =>
                                    setDayFeedbackMap((prev) => ({
                                      ...prev,
                                      [day.dayNumber]: e.target.value
                                    }))
                                  }
                                  placeholder="Enter your custom request..."
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#110d0a] border border-white/15 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-orange-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRegenerateDay(day.dayNumber)}
                                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shrink-0 cursor-pointer"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}

                          {isEditing ? (
                            <div className="space-y-3 text-xs">
                              {(['morningActivities', 'afternoonActivities', 'eveningActivities'] as const).map((fld) => (
                                <div key={fld}>
                                  <label className="font-bold text-stone-200 block mb-1">
                                    {fld === 'morningActivities' ? 'Morning Plan' : fld === 'afternoonActivities' ? 'Afternoon Plan' : 'Evening & Return'}
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={day[fld]}
                                    onChange={(e) =>
                                      handleUpdateDayField(day.dayNumber, fld, e.target.value)
                                    }
                                    className="w-full p-2.5 rounded-lg border border-white/15 bg-[#110d0a] text-white"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Clean Vertical Timeline */
                            <div className="space-y-3 text-xs sm:text-sm">
                              {/* Morning */}
                              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/35 border border-white/5">
                                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 text-xs font-bold">
                                  🌅
                                </span>
                                <div className="space-y-0.5 flex-1">
                                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Morning</span>
                                  <p className="text-stone-200 leading-relaxed text-xs sm:text-sm">{day.morningActivities}</p>
                                </div>
                              </div>

                              {/* Afternoon */}
                              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/35 border border-white/5">
                                <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center shrink-0 text-xs font-bold">
                                  ☀️
                                </span>
                                <div className="space-y-0.5 flex-1">
                                  <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">Afternoon Sightseeing &amp; Lunch</span>
                                  <p className="text-stone-200 leading-relaxed text-xs sm:text-sm">{day.afternoonActivities}</p>
                                </div>
                              </div>

                              {/* Evening */}
                              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/35 border border-white/5">
                                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 text-xs font-bold">
                                  🌆
                                </span>
                                <div className="space-y-0.5 flex-1">
                                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">Evening &amp; Return Journey</span>
                                  <p className="text-stone-200 leading-relaxed text-xs sm:text-sm">{day.eveningActivities}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Curated Meals Ribbon */}
                          <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs">
                            <span className="font-semibold text-stone-300 flex items-center gap-1.5 text-[11px]">
                              <Utensils className="w-3.5 h-3.5 text-orange-400" />
                              Dining &amp; Snacks ({form.foodPreference})
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-300 text-xs">
                              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                <span className="text-[10px] text-stone-400 block">Breakfast</span>
                                <span className="text-stone-200 font-medium line-clamp-1">{day.breakfast || 'Poha / Misal Pav'}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                <span className="text-[10px] text-stone-400 block">Lunch</span>
                                <span className="text-stone-200 font-medium line-clamp-1">{day.lunch || 'Local Thali'}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                <span className="text-[10px] text-stone-400 block">Tea &amp; Snacks</span>
                                <span className="text-stone-200 font-medium line-clamp-1">{day.eveningSnacks || 'Vada Pav / Chai'}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                <span className="text-[10px] text-stone-400 block">Dinner</span>
                                <span className="text-stone-200 font-medium line-clamp-1">{day.dinner || 'Dinner at home/stay'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Day Footer Pills (Transit & Safety) */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-stone-300 text-[11px] font-medium flex items-center gap-1.5">
                              <Route className="w-3 h-3 text-orange-400" />
                              ~{day.estimatedTravelDistanceKm || 50} km travel · {day.estimatedTravelTime || '2 hrs'}
                            </span>
                            {day.safetyNotes && (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-200 border border-amber-500/20 text-[11px] flex items-center gap-1.5">
                                <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                                {day.safetyNotes}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* En-Route Hidden Gems */}
                  {enRouteGems.length > 0 && (
                    <div className="bg-[#18130f] rounded-2xl border border-emerald-500/25 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-emerald-400" />
                          En-Route Free Viewpoints &amp; Hidden Gems
                        </h3>
                        <span className="text-xs text-stone-400 tabular-nums">
                          {includedEnRouteGems.length} included on map
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {enRouteGems.map((gem) => {
                          const excluded = excludedGemIds.includes(gem.id);
                          return (
                            <div
                              key={gem.id}
                              className={`rounded-xl border p-3 flex gap-3 ${
                                excluded
                                  ? 'bg-[#110d0a]/50 border-white/5 opacity-60'
                                  : 'bg-[#110d0a] border-white/15'
                              }`}
                            >
                              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black">
                                <VerifiedWikiImage
                                  wikiTitle={gem.wikiTitle}
                                  alt={gem.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0 text-xs">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-bold text-white truncate">{gem.name}</p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExcludedGemIds((prev) =>
                                        excluded ? prev.filter((x) => x !== gem.id) : [...prev, gem.id]
                                      )
                                    }
                                    className="text-[11px] font-semibold text-emerald-300 hover:underline shrink-0 cursor-pointer"
                                  >
                                    {excluded ? '+ Add' : 'Included'}
                                  </button>
                                </div>
                                <p className="text-[11px] text-amber-300 tabular-nums">
                                  +{gem.detourKm} km detour · {gem.entryFeeInfo}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TRANSPARENT BUDGET & BIKE FUEL MATH */}
              {resultTab === 'budget' && budget && (
                <div className="space-y-5">
                  <div className="bg-[#18130f] rounded-2xl border border-white/10 p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10">
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-orange-400" />
                          Group Budget Breakdown ({budget.groupSize} Travelers ·{' '}
                          {budget.tripType === 'one-day' ? 'Same-Day Return' : `${budget.days} Days`})
                        </h3>
                        <p className="text-xs text-stone-400 mt-0.5">{budget.pricingDisclaimer}</p>
                      </div>
                      <div className="text-right tabular-nums">
                        <span
                          className={`text-2xl font-black ${
                            budget.isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          ₹{budget.estimatedTotalCost.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-stone-300 block">
                          ₹{budget.perPersonCost.toLocaleString('en-IN')}/person · Limit ₹
                          {budget.totalGroupBudget.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Clean Vehicle Travel & Fuel Card */}
                    {budget.fuelCalculation?.applicable && (
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs space-y-2.5">
                        <div className="flex items-center justify-between text-amber-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Fuel className="w-4 h-4 text-orange-400" />
                            Estimated {budget.fuelCalculation.vehicleMode} Fuel Cost
                          </span>
                          <span className="text-sm font-black text-amber-300 tabular-nums">
                            ~₹{budget.fuelCalculation.fuelCostInr.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-stone-300 text-xs">
                          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                            <span className="text-[10px] text-stone-400 block font-medium">Round-Trip Distance</span>
                            <span className="text-white font-bold">{budget.fuelCalculation.totalDistanceKm} km</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                            <span className="text-[10px] text-stone-400 block font-medium">Expected Mileage</span>
                            <span className="text-white font-bold">{budget.fuelCalculation.mileageKmPerLitre} km/L</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                            <span className="text-[10px] text-stone-400 block font-medium">Estimated Fuel</span>
                            <span className="text-white font-bold">{budget.fuelCalculation.fuelRequiredLitres} litres</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Remaining / Over Budget Status */}
                    {budget.isOverBudget ? (
                      <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-100 space-y-1">
                        <p className="font-bold text-rose-300">
                          Over Group Budget by ₹{budget.overBudgetBy.toLocaleString('en-IN')}
                        </p>
                        {budget.budgetOptimizationTips.map((tip, i) => (
                          <p key={i}>• {tip}</p>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/35 text-xs text-emerald-100 flex flex-wrap items-center justify-between gap-2 tabular-nums">
                        <span className="font-semibold flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          Essential costs stay under ₹{budget.totalGroupBudget.toLocaleString('en-IN')} total group budget
                        </span>
                        <span className="font-bold text-emerald-300">
                          Remaining Unspent: ₹{budget.remainingBudget.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    {/* Essential Expenses: Clean 4 to 5 Pillar Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-[11px] text-stone-400 block font-medium flex items-center gap-1">
                          <Fuel className="w-3.5 h-3.5 text-orange-400" /> Travel &amp; Fuel
                        </span>
                        <span className="text-base font-black text-white block">
                          ₹{Number(budget.fuelCalculation?.applicable ? budget.categories.fuelCost : budget.categories.transportation).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-stone-400 block">Round-trip transit</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-[11px] text-stone-400 block font-medium flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5 text-amber-400" /> Food &amp; Meals
                        </span>
                        <span className="text-base font-black text-white block">
                          ₹{Number(budget.categories.foodAndBeverages).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-stone-400 block">Meals &amp; snacks</span>
                      </div>

                      {budget.tripType !== 'one-day' && (
                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[11px] text-stone-400 block font-medium flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-sky-400" /> Stay / Hotel
                          </span>
                          <span className="text-base font-black text-white block">
                            ₹{Number(budget.categories.accommodation).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-stone-400 block">Night stay</span>
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-[11px] text-stone-400 block font-medium flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5 text-emerald-400" /> Entry &amp; Tolls
                        </span>
                        <span className="text-base font-black text-white block">
                          ₹{Number((budget.categories.entryFees || 0) + (budget.categories.parkingAndTolls || 0) + (budget.categories.activities || 0)).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-stone-400 block">Tickets &amp; parking</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-[11px] text-stone-400 block font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Emergency Buffer
                        </span>
                        <span className="text-base font-black text-white block">
                          ₹{Number((budget.categories.emergencyReserve || 0) + (budget.categories.miscellaneous || 0)).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-stone-400 block">Unforeseen reserves</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TRANSPORT, FOOD & PRACTICAL TIPS */}
              {resultTab === 'transport' && (
                <div className="space-y-5">
                  {/* Transport Comparison */}
                  {Array.isArray(plan.transportComparison) && plan.transportComparison.length > 0 && (
                    <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Train className="w-4 h-4 text-orange-400" />
                        Transit Mode Comparison
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {(plan.transportComparison as TransportComparisonOption[]).map((opt) => {
                          const isSelected = selectedTransportMode === opt.mode;
                          return (
                            <div
                              key={opt.mode}
                              className={`p-3.5 rounded-xl border space-y-2 ${
                                isSelected
                                  ? 'bg-orange-500/10 border-orange-500/50'
                                  : 'bg-[#110d0a] border-white/10'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                                    <Bus className="w-3.5 h-3.5 text-orange-400" />
                                    {opt.mode}
                                  </span>
                                  <p className="text-[11px] text-stone-400 mt-0.5">
                                    {opt.originHub} → {opt.destinationHub}
                                  </p>
                                </div>
                                <div className="text-right tabular-nums shrink-0">
                                  <span className="font-bold text-amber-300 block">
                                    ~₹{opt.approxGroupCostInr.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[11px] text-stone-400">
                                    {opt.estimatedDuration}
                                  </span>
                                </div>
                              </div>
                              <p className="text-stone-300 text-[11px]">{opt.suitabilityNote}</p>
                              <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/10">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedTransportMode(isSelected ? null : opt.mode)
                                  }
                                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                                    isSelected
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-white/10 hover:bg-white/15 text-white'
                                  }`}
                                >
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                                {opt.bookingUrl && (
                                  <a
                                    href={opt.bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:underline"
                                  >
                                    {opt.provider} <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fuel Stations for Bike/Car (Top 3 only) */}
                  {fuelStations.length > 0 && (
                    <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-amber-400" />
                        Nearby Petrol / Fuel Stations
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        {fuelStations.slice(0, 3).map((f) => (
                          <div
                            key={f.id}
                            className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{f.name}</p>
                              <p className="text-[10px] text-stone-400 truncate">{f.address || 'Along travel route'}</p>
                            </div>
                            <span className="text-amber-300 font-bold tabular-nums text-xs shrink-0">
                              {f.distanceKm} km
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regional Food Stops & Practical Safety */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Food Stops */}
                    <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-orange-400" /> Recommended Dining
                      </h4>
                      <div className="space-y-2">
                        {(plan.restaurants || []).slice(0, 3).map((r: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs flex items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-white">{r.name}</p>
                              <p className="text-[11px] text-stone-400">{r.location} • {r.cuisine}</p>
                            </div>
                            <span className="text-amber-300 text-[11px] font-semibold shrink-0">
                              {r.priceRange || 'Budget friendly'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Practical Safety & Helplines */}
                    <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <BookmarkCheck className="w-4 h-4 text-emerald-400" /> Travel Safety &amp; Helplines
                      </h4>

                      {/* Helpline Pills */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
                          <span className="text-[10px] text-rose-300 font-semibold block">Emergency Services</span>
                          <strong className="text-white text-sm">Dial 112</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                          <span className="text-[10px] text-amber-300 font-semibold block">Highway Help (NH/SH)</span>
                          <strong className="text-white text-sm">Dial 1033</strong>
                        </div>
                      </div>

                      {/* Key Safety Points */}
                      <ul className="text-xs text-stone-300 space-y-1.5 pt-1">
                        <li className="flex items-start gap-1.5 text-stone-300">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>Drive in low gear on ghat curves; avoid two-wheeler ghat travel after dark.</span>
                        </li>
                        <li className="flex items-start gap-1.5 text-stone-300">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>Keep cash handy for toll gates, village parking, and local eateries.</span>
                        </li>
                        {(plan.warnings || []).slice(0, 2).map((w: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5 text-amber-300 text-[11px]">
                            <span>⚠️</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Multi-Day Accommodation Manager (Automatically hidden on One-Day Trips) */}
                  {!planIsOneDay && hotelAlternatives.length > 0 && (
                    <div className="bg-[#18130f] rounded-2xl border border-white/10 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-orange-400" /> Accommodation Options (Multi-Day Stay)
                        </h3>
                        {activeStay && (
                          <button
                            type="button"
                            onClick={() => setStayRemoved(true)}
                            className="text-xs text-stone-300 hover:text-red-300 cursor-pointer"
                          >
                            Remove Stay
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {hotelAlternatives.map((h) => {
                          const isChosen = activeStay?.id === h.id;
                          return (
                            <div
                              key={h.id}
                              className={`p-3.5 rounded-xl border space-y-1.5 ${
                                isChosen
                                  ? 'bg-orange-500/10 border-orange-500/50'
                                  : 'bg-[#110d0a] border-white/10'
                              }`}
                            >
                              <div className="flex justify-between gap-2">
                                <p className="font-bold text-white">{h.name}</p>
                                <span className="text-amber-300 font-bold tabular-nums">
                                  ₹{h.priceMin}–₹{h.priceMax}/night
                                </span>
                              </div>
                              <p className="text-stone-400">{h.location}</p>
                              <div className="pt-1.5 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStayRemoved(false);
                                    setSelectedStayId(h.id);
                                  }}
                                  className="text-orange-400 font-semibold cursor-pointer"
                                >
                                  {isChosen ? 'Selected Stay' : 'Select Stay'}
                                </button>
                                <a
                                  href={h.bookingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-stone-300 hover:text-white inline-flex items-center gap-1"
                                >
                                  {h.bookingProvider} <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
