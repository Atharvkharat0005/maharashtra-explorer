import { HotelListing, RestaurantListing, TransportGuide } from '../types.js';

export const TRAVEL_AGENTS_DIRECTORY = [
  {
    id: 1,
    name: 'Sahyadri Heritage Treks & Tours',
    location: 'Pune, Maharashtra',
    division: 'Pune',
    specialization: 'Fort Trekking, Historical Expeditions & Sahyadri Eco-Camping',
    rating: 4.9,
    reviewsCount: 142,
    phone: '+91 98231 45678',
    email: 'contact@sahyadritreks.example.com',
    verifiedBadge: 'MTDC / Local Guide Certified',
    packages: [
      { title: 'Raigad & Shivneri Forts Weekend Expedition', duration: '2 Days / 1 Night', price: 'Approx. ₹3,499 / person' },
      { title: 'Sinhagad Sunrise Trek & Village Culinary Tour', duration: '1 Day', price: 'Approx. ₹1,299 / person' },
      { title: 'Kalsubai Peak & Sandhan Valley Canyon Trek', duration: '2 Days / 1 Night', price: 'Approx. ₹2,899 / person' }
    ]
  },
  {
    id: 2,
    name: 'Konkan Coastal Escapes',
    location: 'Alibaug & Malvan, Maharashtra',
    division: 'Konkan',
    specialization: 'Certified Scuba Diving, Beach Homestays, Sea Forts & Water Sports',
    rating: 4.8,
    reviewsCount: 198,
    phone: '+91 98220 87654',
    email: 'info@konkanescapes.example.com',
    verifiedBadge: 'Konkan Coastal Operator',
    packages: [
      { title: 'Tarkarli Scuba Diving & Sindhudurg Fort Circuit', duration: '3 Days / 2 Nights', price: 'Approx. ₹8,999 / person' },
      { title: 'Alibaug Beach & Murud-Janjira Ferry Tour', duration: '2 Days / 1 Night', price: 'Approx. ₹4,799 / person' },
      { title: 'Ganpatipule, Velas & Guhagar Coastal Drive', duration: '3 Days / 2 Nights', price: 'Approx. ₹6,499 / person' }
    ]
  },
  {
    id: 3,
    name: 'Marathwada Heritage & Caves Tourism',
    location: 'Chhatrapati Sambhajinagar, Maharashtra',
    division: 'Chhatrapati Sambhajinagar',
    specialization: 'UNESCO Ajanta & Ellora ASI Guided Circuits, Daulatabad & Jyotirlingas',
    rating: 4.9,
    reviewsCount: 230,
    phone: '+91 94222 11223',
    email: 'explore@ajantaelloratours.example.com',
    verifiedBadge: 'ASI Licensed Guide Network',
    packages: [
      { title: 'Ajanta & Ellora Caves Guided Archaeological Circuit', duration: '2 Days / 1 Night', price: 'Approx. ₹5,200 / person' },
      { title: 'Daulatabad, Grishneshwar & Lonar Crater Heritage Tour', duration: '3 Days / 2 Nights', price: 'Approx. ₹7,800 / person' }
    ]
  },
  {
    id: 4,
    name: 'Vidarbha Tiger Safari & Eco-Expeditions',
    location: 'Nagpur & Chandrapur, Maharashtra',
    division: 'Nagpur',
    specialization: 'Tadoba, Pench, Melghat & Tipeshwar Wildlife Safaris & Eco-Lodges',
    rating: 4.9,
    reviewsCount: 167,
    phone: '+91 97654 32109',
    email: 'safari@vidarbhawildlife.example.com',
    verifiedBadge: 'Vidarbha Wildlife Naturalists',
    packages: [
      { title: 'Tadoba-Andhari Core & Buffer Safari Experience', duration: '3 Days / 2 Nights', price: 'Approx. ₹12,499 / person' },
      { title: 'Pench Sillari & Ramtek Heritage Weekend', duration: '2 Days / 1 Night', price: 'Approx. ₹7,200 / person' }
    ]
  }
];

export const CURATED_HOTELS: HotelListing[] = [
  {
    id: 'hotel-mtdc-raigad',
    name: 'MTDC Raigad Fort Holiday Resort',
    districtId: 'raigad',
    location: 'Raigad Fort Top Plateau, Mahad',
    propertyType: 'MTDC Resort',
    priceMin: 2200,
    priceMax: 4200,
    priceNote: 'Estimated tariff range; verify live room availability on official MTDC portal',
    amenities: ['Summit Heritage Proximity', 'Basic Restaurant', '24h Water', 'Mountain View'],
    bookingUrl: 'https://www.maharashtratourism.gov.in/',
    bookingProvider: 'Maharashtra Tourism (MTDC Official)',
    wikiTitle: 'Raigad Fort',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-mtdc-tarkarli',
    name: 'MTDC Tarkarli Beach Resort',
    districtId: 'sindhudurg',
    location: 'Tarkarli Beachfront, Malvan',
    propertyType: 'MTDC Resort',
    priceMin: 3200,
    priceMax: 6800,
    priceNote: 'Estimated seasonal tariff; check live room availability directly on MTDC',
    amenities: ['Direct Beachfront', 'Konkani Cottages', 'Parking', 'Sea View'],
    bookingUrl: 'https://www.maharashtratourism.gov.in/',
    bookingProvider: 'Maharashtra Tourism (MTDC Official)',
    wikiTitle: 'Tarkarli',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-ramayana-ellora',
    name: 'MTDC Holiday Resort Aurangabad / Ellora Heritage Stays',
    districtId: 'chhatrapati-sambhajinagar',
    location: 'Station Road / Verul Road, Chhatrapati Sambhajinagar',
    propertyType: 'Boutique Hotel',
    priceMin: 2400,
    priceMax: 5800,
    priceNote: 'Estimated range per room/night; live rates vary by date',
    amenities: ['AC Rooms', 'Wi-Fi', 'Travel Desk', 'Parking'],
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Chhatrapati+Sambhajinagar',
    bookingProvider: 'Booking.com Search',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-mtdc-mahabaleshwar',
    name: 'MTDC Holiday Resort Mahabaleshwar',
    districtId: 'satara',
    location: 'Old Mahabaleshwar Road, Satara',
    propertyType: 'MTDC Resort',
    priceMin: 2800,
    priceMax: 6200,
    priceNote: 'Estimated range per room/night; verify live availability on MTDC',
    amenities: ['Forest Campus', 'Family Suites', 'Restaurant', 'Parking'],
    bookingUrl: 'https://www.maharashtratourism.gov.in/',
    bookingProvider: 'Maharashtra Tourism (MTDC Official)',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-kaas-homestay',
    name: 'Satara & Kaas Valley Agro-Homestays',
    districtId: 'satara',
    location: 'Bamnaoli / Kaas Road, Satara',
    propertyType: 'Homestay',
    priceMin: 1600,
    priceMax: 3200,
    priceNote: 'Estimated tariff per room; peak bloom season requires advance booking',
    amenities: ['Home-Cooked Maharashtrian Meals', 'Valley Views', 'Parking'],
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Satara+Maharashtra',
    bookingProvider: 'Booking.com Search',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-tadoba-eco',
    name: 'MTDC Moharli & Tadoba Eco-Lodges',
    districtId: 'chandrapur',
    location: 'Moharli Gate / Kolara Gate, Chandrapur',
    propertyType: 'Eco Lodge',
    priceMin: 3500,
    priceMax: 9500,
    priceNote: 'Estimated range; safari permits must be booked separately on MahaEcoTourism',
    amenities: ['Safari Gate Proximity', 'Naturalist Guidance', 'All-Meal Options', 'Parking'],
    bookingUrl: 'https://www.maharashtratourism.gov.in/',
    bookingProvider: 'Maharashtra Tourism / MahaEcoTourism',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-lonar-mtdc',
    name: 'MTDC Lonar Crater View Resort',
    districtId: 'buldhana',
    location: 'Lonar Crater Rim, Buldhana',
    propertyType: 'MTDC Resort',
    priceMin: 2000,
    priceMax: 3800,
    priceNote: 'Estimated range; verify live availability on MTDC',
    amenities: ['Crater Rim View', 'AC Cottages', 'Restaurant', 'Parking'],
    bookingUrl: 'https://www.maharashtratourism.gov.in/',
    bookingProvider: 'Maharashtra Tourism (MTDC Official)',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-chikhaldara-mtdc',
    name: 'MTDC Mozari Point Resort Chikhaldara',
    districtId: 'amravati',
    location: 'Chikhaldara, Amravati',
    propertyType: 'MTDC Resort',
    priceMin: 2200,
    priceMax: 4500,
    priceNote: 'Estimated tariff range; verify live availability on MTDC',
    amenities: ['Valley View', 'Family Rooms', 'Dining Hall', 'Parking'],
    bookingUrl: 'https://www.maharashtratourism.gov.in/',
    bookingProvider: 'Maharashtra Tourism (MTDC Official)',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-bhandardara-mtdc',
    name: 'MTDC Bhandardara Lakeside Resort',
    districtId: 'ahilyanagar',
    location: 'Arthur Lake Shore, Bhandardara, Ahilyanagar',
    propertyType: 'MTDC Resort',
    priceMin: 2400,
    priceMax: 5200,
    priceNote: 'Estimated tariff range; check MTDC portal for live dates',
    amenities: ['Arthur Lake View', 'Cottages', 'Restaurant', 'Parking'],
    bookingUrl: 'https://www.maharashtratourism.gov.in/',
    bookingProvider: 'Maharashtra Tourism (MTDC Official)',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-mumbai-heritage',
    name: 'Colaba & Fort Heritage Boutique Hotels',
    districtId: 'mumbai-city',
    location: 'Colaba / Apollo Bunder, Mumbai',
    propertyType: 'Boutique Hotel',
    priceMin: 3800,
    priceMax: 12000,
    priceNote: 'Estimated Mumbai South district range; live pricing varies widely by date',
    amenities: ['Walkable to Gateway', 'Wi-Fi', 'AC', 'Breakfast Options'],
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Colaba+Mumbai',
    bookingProvider: 'Booking.com Search',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-pune-central',
    name: 'Deccan & Shivajinagar Traveler Hotels',
    districtId: 'pune',
    location: 'Deccan Gymkhana / Shivajinagar, Pune',
    propertyType: 'Boutique Hotel',
    priceMin: 2200,
    priceMax: 5500,
    priceNote: 'Estimated range per room/night; compare live availability on provider',
    amenities: ['Central Transit Hub', 'Wi-Fi', 'AC', 'Restaurant'],
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Pune+Maharashtra',
    bookingProvider: 'Booking.com Search',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-nashik-vineyard',
    name: 'Trimbak Road & Vineyard Region Stays',
    districtId: 'nashik',
    location: 'Gangapur Dam / Trimbak Road, Nashik',
    propertyType: 'Resort',
    priceMin: 2600,
    priceMax: 7500,
    priceNote: 'Estimated range per room/night; verify live availability on provider',
    amenities: ['Vineyard Proximity', 'Garden', 'Family Friendly', 'Parking'],
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Nashik+Maharashtra',
    bookingProvider: 'Booking.com Search',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-ganpatipule-mtdc',
    name: 'MTDC Konkan Resort Ganpatipule',
    districtId: 'ratnagiri',
    location: 'Ganpatipule Beachfront, Ratnagiri',
    propertyType: 'MTDC Resort',
    priceMin: 2500,
    priceMax: 5500,
    priceNote: 'Estimated tariff range; verify live availability on MTDC',
    amenities: ['Beachfront Access', 'Konkani Dining', 'Parking'],
    bookingUrl: 'https://www.maharashtratourism.gov.in/',
    bookingProvider: 'Maharashtra Tourism (MTDC Official)',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'hotel-kolhapur-royal',
    name: 'Tarabai Park & Mahalaxmi Precinct Stays',
    districtId: 'kolhapur',
    location: 'Tarabai Park / Station Road, Kolhapur',
    propertyType: 'Boutique Hotel',
    priceMin: 1800,
    priceMax: 4500,
    priceNote: 'Estimated range per room/night',
    amenities: ['Central Kolhapur', 'Wi-Fi', 'Pure Veg & Kolhapuri Dining Nearby', 'Parking'],
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Kolhapur+Maharashtra',
    bookingProvider: 'Booking.com Search',
    verificationStatus: 'VERIFIED'
  }
];

export const CURATED_RESTAURANTS: RestaurantListing[] = [
  {
    id: 'rest-raigad-pithla',
    name: 'Pachad Foothill Rural Khanaval & Fort Stall',
    districtId: 'raigad',
    location: 'Pachad / Raigadwadi',
    cuisine: 'Authentic Rural Maharashtrian',
    specialtyDishes: ['Zunka Bhakri', 'Kharvas', 'Kanda Bhaji', 'Kothimbir Vadi'],
    priceRange: '₹150 – ₹350 / person',
    avgMealCostPerPerson: 220,
    openingHoursInfo: '7:30 AM – 7:00 PM',
    dietaryTags: ['Veg', 'Maharashtrian'],
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'rest-tarkarli-malvani',
    name: 'Malvan Kinara Traditional Seafood Kitchens',
    districtId: 'sindhudurg',
    location: 'Tarkarli – Malvan Road',
    cuisine: 'Malvani Coastal & Konkani',
    specialtyDishes: ['Surmai Fry Thali', 'Kombdi Vade', 'Solkadhi', 'Veg Malvani Usal'],
    priceRange: '₹250 – ₹550 / person',
    avgMealCostPerPerson: 380,
    openingHoursInfo: '11:30 AM – 3:30 PM, 7:00 PM – 10:30 PM',
    dietaryTags: ['Seafood', 'Non-Veg', 'Veg', 'Maharashtrian'],
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'rest-aurangabad-thali',
    name: 'Marathwada Authentic Thali & Naan Qalia Houses',
    districtId: 'chhatrapati-sambhajinagar',
    location: 'Nirala Bazaar / Verul Road, Chhatrapati Sambhajinagar',
    cuisine: 'Marathwada Heritage & Mughlai',
    specialtyDishes: ['Shev Bhaji', 'Jowar Bhakri', 'Naan Qalia', 'Hurda (winter)'],
    priceRange: '₹220 – ₹480 / person',
    avgMealCostPerPerson: 320,
    openingHoursInfo: '11:30 AM – 10:30 PM',
    dietaryTags: ['Veg', 'Non-Veg', 'Maharashtrian'],
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'rest-pune-misal',
    name: 'Traditional Pune Misal & Sabudana Wada Eateries',
    districtId: 'pune',
    location: 'Sadashiv Peth / Sinhagad Road, Pune',
    cuisine: 'Puneri Vegetarian & Snacks',
    specialtyDishes: ['Puneri Misal Pav', 'Thalipeeth', 'Puran Poli', 'Mastani'],
    priceRange: '₹150 – ₹350 / person',
    avgMealCostPerPerson: 240,
    openingHoursInfo: '7:30 AM – 10:00 PM',
    dietaryTags: ['Veg', 'Jain Friendly', 'Maharashtrian'],
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'rest-satara-kandi',
    name: 'Satara Kandi Pedha & Mapro Strawberry Kitchens',
    districtId: 'satara',
    location: 'Satara / Panchgani–Mahabaleshwar Road',
    cuisine: 'Western Ghats Cafe & Rural Thali',
    specialtyDishes: ['Fresh Strawberry & Cream', 'Satara Kandi Pedha', 'Corn Pakoda', 'Veg Thali'],
    priceRange: '₹200 – ₹450 / person',
    avgMealCostPerPerson: 300,
    openingHoursInfo: '8:30 AM – 9:30 PM',
    dietaryTags: ['Veg', 'Jain Friendly', 'Maharashtrian'],
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'rest-kolhapur-rassa',
    name: 'Traditional Kolhapuri Tambda-Pandhra & Misal Houses',
    districtId: 'kolhapur',
    location: 'Rajarampuri / Station Road, Kolhapur',
    cuisine: 'Kolhapuri',
    specialtyDishes: ['Tambda & Pandhra Rassa', 'Kolhapuri Misal', 'Pithla Bhakri', 'Veg Katwachi Amti'],
    priceRange: '₹180 – ₹450 / person',
    avgMealCostPerPerson: 280,
    openingHoursInfo: '8:00 AM – 10:30 PM',
    dietaryTags: ['Non-Veg', 'Veg', 'Maharashtrian'],
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'rest-nagpur-saoji',
    name: 'Vidarbha Saoji & Tarri Poha Kitchens',
    districtId: 'nagpur',
    location: 'Dharampeth / Sitabuldi, Nagpur',
    cuisine: 'Vidarbha Saoji & Street Specialties',
    specialtyDishes: ['Nagpur Tarri Poha', 'Patodi Rassa (Veg)', 'Saoji Curry', 'Orange Barfi'],
    priceRange: '₹160 – ₹420 / person',
    avgMealCostPerPerson: 260,
    openingHoursInfo: '7:00 AM – 10:30 PM',
    dietaryTags: ['Veg', 'Non-Veg', 'Maharashtrian'],
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'rest-nashik-misal',
    name: 'Nashik Black-Masala Misal & Goda Thali',
    districtId: 'nashik',
    location: 'College Road / Gangapur Road, Nashik',
    cuisine: 'Khandesh & Nashik Maharashtrian',
    specialtyDishes: ['Nashik Kala Masala Misal', 'Shevga Curry', 'Jowar Bhakri'],
    priceRange: '₹150 – ₹380 / person',
    avgMealCostPerPerson: 240,
    openingHoursInfo: '8:00 AM – 10:00 PM',
    dietaryTags: ['Veg', 'Jain Friendly', 'Maharashtrian'],
    verificationStatus: 'VERIFIED'
  }
];

export const OFFICIAL_BOOKING_LINKS = {
  trains: {
    provider: 'IRCTC Official Indian Railways',
    url: 'https://www.irctc.co.in/nget/train-search',
    note: 'Official railway schedules and ticket booking happen on IRCTC.'
  },
  buses: {
    provider: 'MSRTC (Maharashtra State Road Transport)',
    url: 'https://msrtc.maharashtra.gov.in/',
    note: 'Book Shivneri, Shivshahi, and ST state buses directly on MSRTC.'
  },
  hotelsMtdc: {
    provider: 'MTDC Official Resorts',
    url: 'https://www.maharashtratourism.gov.in/',
    note: 'Verify live availability and reserve MTDC resorts on the official portal.'
  },
  safari: {
    provider: 'MahaEcoTourism (Maharashtra Forest Dept)',
    url: 'https://mahaecotourism.gov.in/',
    note: 'Official Tiger Reserve & Wildlife Sanctuary safari permit portal.'
  },
  asiMonuments: {
    provider: 'ASI PayUMoney / Monument e-Ticketing',
    url: 'https://asi.payumoney.com/',
    note: 'Book Ajanta, Ellora, Daulatabad, and Elephanta ASI monument tickets.'
  }
};
