import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'mr' | 'hi';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  shortLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', shortLabel: 'EN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', shortLabel: 'म' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', shortLabel: 'हि' }
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    'brand.title': 'Maharashtra',
    'brand.highlight': 'Explorer',
    'brand.sub': 'MAHATRIP AI',
    'nav.home': 'Home',
    'nav.planner': 'Plan a Trip',
    'nav.explore': 'Explore',
    'nav.dashboard': 'My Trips',
    'nav.help': 'Help & Safety',
    'nav.signIn': 'Sign In',
    'nav.signOut': 'Sign Out',
    'nav.myAccount': 'Account',
    'nav.toggleMenu': 'Toggle navigation menu',
    'nav.language': 'Language',
    'nav.chooseLanguage': 'Select language',

    // Hero Section
    'hero.badge': 'Maharashtra Explorer · MAHATRIP AI',
    'hero.titlePre': 'Practical Trips Across',
    'hero.titleHighlight': 'All 36 Districts',
    'hero.description': 'Plan one-day bike escapes or multi-day Maharashtra circuits under your real total group budget — with same-day return timing, fuel math, and verified places.',
    'hero.btnPlan': 'Plan a Trip (1-Day or Multi-Day)',
    'hero.btnExplore': 'Explore Maharashtra',

    // Popular Destinations Section
    'home.curatedTag': 'Curated Destinations',
    'home.popularHeading': 'Popular Places Across Maharashtra',
    'home.viewAllDistricts': 'View All 36 Districts',
    'home.detailsBtn': 'Details',
    'home.planTripBtn': 'Plan Trip',
    'home.est': 'Est.',
    'home.perPerson': '/person',
    'home.goodFor1Day': 'Good for 1-Day',
    'home.days': 'Days',

    // Categories
    'cat.All': 'All',
    'cat.Fort': 'Fort',
    'cat.Cave': 'Cave',
    'cat.Beach': 'Beach',
    'cat.Hill Station': 'Hill Station',
    'cat.Temple': 'Temple',
    'cat.Wildlife': 'Wildlife',
    'cat.Nature': 'Nature',
    'cat.Waterfall': 'Waterfall',
    'cat.Pilgrimage': 'Pilgrimage',

    // Hidden Gems Section
    'gems.tag': 'Offbeat Escapes',
    'gems.heading': 'Quiet Viewpoints & Hidden Gems',
    'gems.exploreBtn': 'Explore Hidden Gems',
    'gems.permitAlert': 'Permit check required',
    'gems.safetyNotes': 'Safety Notes & Details →',

    // 6 Administrative Divisions
    'divisions.heading': 'Browse by Region (6 Divisions)',
    'divisions.subtitle': "Jump straight into any of Maharashtra's 36 districts with talukas and rail/bus hubs.",
    'divisions.division': 'Division',
    'divisions.districts': 'Districts',

    // Explore Maharashtra Section
    'explore.tabDistricts': 'All 36 Districts & Directory',
    'explore.tabHiddenGems': 'Hidden Gems & Offbeat Spots',
    'explore.searchPlaceholder': 'Search district, division, or attraction...',
    'explore.filterDivision': 'All Divisions',
    'explore.selectTaluka': 'All Talukas',
    'explore.viewAttractions': 'Attractions',
    'explore.viewHotels': 'Hotels & Lodges',
    'explore.viewRestaurants': 'Authentic Dining',
    'explore.liveWeather': 'Live Weather',
    'explore.weatherSafe': 'Safe for Travel',
    'explore.exploreDistrict': 'Explore District',
    'explore.planForDistrict': 'Plan Trip in District',

    // Planner Section
    'planner.title': 'MAHATRIP AI Trip Planner',
    'planner.subtitle': 'Custom itineraries tailored to your vehicle, budget, group type, and weather.',
    'planner.startCity': 'Starting City',
    'planner.startingDistrict': 'Starting District',
    'planner.findLocationIn': 'Find Location in',
    'planner.locationsAvailable': 'spots available',
    'planner.matchingLocations': 'Matching locations in',
    'planner.popularSpots': 'Popular',
    'planner.startingFrom': 'Starting from',
    'planner.fetchDistricts': 'Fetch Districts',
    'planner.filterByDistrict': 'Filter by district',
    'planner.allMaharashtra': 'All Maharashtra',
    'planner.duration': 'Trip Duration',
    'planner.oneDayReturn': '1-Day Quick Return',
    'planner.multiDay': 'Multi-Day Circuit',
    'planner.groupType': 'Group Type',
    'planner.budgetTier': 'Budget Tier',
    'planner.budgetBudget': 'Budget (₹1,500/day)',
    'planner.budgetModerate': 'Moderate (₹3,000/day)',
    'planner.budgetComfort': 'Comfort (₹5,500/day)',
    'planner.generateBtn': 'Generate AI Itinerary',
    'planner.saveBtn': 'Save Trip to Dashboard',
    'planner.generating': 'Calculating route, weather, and authentic stops...',

    // Help & Safety
    'help.title': 'Maharashtra Travel Safety & Emergency Network',
    'help.subtitle': 'Verified emergency numbers, medical aid, district police, and monsoon safety alerts.',
    'help.emergency112': 'India Emergency (Police, Fire, Ambulance): 112',
    'help.mtdc': 'MTDC Tourist Helpline: 1800-229-930',
    'help.highwayPolice': 'Maharashtra Highway Police: 98224 98224',
    'help.trustedContact': 'Your Trusted Emergency Contact',
    'help.saveContact': 'Save Contact',

    // Dashboard / My Trips
    'dash.title': 'Traveler Dashboard',
    'dash.savedTrips': 'Saved Itineraries',
    'dash.favorites': 'Favorite Destinations',
    'dash.expenseTracker': 'Group Expense Tracker',
    'dash.noTrips': 'No trips saved yet. Head to Plan a Trip to generate your personalized itinerary!',

    // Modals & Auth
    'auth.signInTitle': 'Sign In to Maharashtra Explorer',
    'auth.registerTitle': 'Create Traveler Account',
    'auth.subtitle': 'Save AI trips, log group expenses, and keep trusted safety contacts.',
    'auth.fullName': 'Full Name',
    'auth.homeCity': 'Home City',
    'auth.phone': 'Phone Number',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.submitLogin': 'Sign In',
    'auth.submitRegister': 'Create Account',
    'auth.needAccount': 'Need an account? Register',
    'auth.haveAccount': 'Already have an account? Sign In',
    'auth.demoBtn': 'Fill Demo Account',

    // Detail Modal
    'detail.bestTime': 'Best Time to Visit',
    'detail.timings': 'Timings & Entry',
    'detail.highlights': 'Highlights & Activities',
    'detail.howToReach': 'How to Reach',
    'detail.planTrip': 'Plan Trip Here',
    'detail.close': 'Close',

    // Footer
    'footer.brand': 'Maharashtra Explorer · Powered by MAHATRIP AI',
    'footer.motto': 'Discover Maharashtra · Plan Smarter · Travel Within Your Budget.',
    'footer.emergency': 'India Emergency: 112',
    'footer.helpline': 'MTDC Helpline: 1800-229-930'
  },

  mr: {
    // Brand & Header
    'brand.title': 'महाराष्ट्र',
    'brand.highlight': 'एक्सप्लोरर',
    'brand.sub': 'महाट्रिप एआय',
    'nav.home': 'मुखपृष्ठ',
    'nav.planner': 'सहल नियोजन',
    'nav.explore': 'एक्सप्लोर करा',
    'nav.dashboard': 'माझ्या सहली',
    'nav.help': 'मदत आणि सुरक्षा',
    'nav.signIn': 'साइन इन',
    'nav.signOut': 'साइन आउट',
    'nav.myAccount': 'माझे खाते',
    'nav.toggleMenu': 'नेव्हिगेशन मेनू उघडा/बंद करा',
    'nav.language': 'भाषा',
    'nav.chooseLanguage': 'भाषा निवडा',

    // Hero Section
    'hero.badge': 'महाराष्ट्र एक्सप्लोरर · महाट्रिप एआय',
    'hero.titlePre': 'सर्व ३६ जिल्ह्यांमध्ये',
    'hero.titleHighlight': 'परिपूर्ण सहली',
    'hero.description': 'तुमच्या प्रत्यक्ष ग्रुप बजेटनुसार १ दिवसाच्या किंवा अनेक दिवसांच्या महाराष्ट्र सहलींचे अचूक नियोजन करा — इंधन खर्च, सुरक्षित वेळ आणि खात्रीशीर पर्यटन स्थळांसह.',
    'hero.btnPlan': 'सहल नियोजित करा (१-दिवस किंवा अनेक दिवस)',
    'hero.btnExplore': 'महाराष्ट्र एक्सप्लोर करा',

    // Popular Destinations Section
    'home.curatedTag': 'खास निवडक पर्यटन स्थळे',
    'home.popularHeading': 'महाराष्ट्रातील लोकप्रिय पर्यटन स्थळे',
    'home.viewAllDistricts': 'सर्व ३६ जिल्हे पहा',
    'home.detailsBtn': 'तपशील',
    'home.planTripBtn': 'सहल आखा',
    'home.est': 'अंदाजे',
    'home.perPerson': '/व्यक्ती',
    'home.goodFor1Day': '१ दिवसासाठी उत्तम',
    'home.days': 'दिवस',

    // Categories
    'cat.All': 'सर्व',
    'cat.Fort': 'किल्ले',
    'cat.Cave': 'लेणी',
    'cat.Beach': 'समुद्रकिनारे',
    'cat.Hill Station': 'थंड हवेचे ठिकाण',
    'cat.Temple': 'मंदिरे',
    'cat.Wildlife': 'वन्यजीव',
    'cat.Nature': 'निसर्ग',
    'cat.Waterfall': 'धबधबे',
    'cat.Pilgrimage': 'तीर्थक्षेत्र',

    // Hidden Gems Section
    'gems.tag': 'अपरिचित निसर्गरम्य पर्यटन',
    'gems.heading': 'शांत निसर्गरम्य ठिकाणे आणि गुप्त स्थळे',
    'gems.exploreBtn': 'गुप्त ठिकाणे एक्सप्लोर करा',
    'gems.permitAlert': 'परवानगी तपासणी आवश्यक',
    'gems.safetyNotes': 'सुरक्षा सूचना आणि तपशील →',

    // 6 Administrative Divisions
    'divisions.heading': 'विभागानुसार पर्यटन (६ प्रशासकीय विभाग)',
    'divisions.subtitle': 'महाराष्ट्राच्या ३६ जिल्ह्यांची तालुके, रेल्वे आणि बस माहितीसह थेट माहिती मिळवा.',
    'divisions.division': 'विभाग',
    'divisions.districts': 'जिल्हे',

    // Explore Maharashtra Section
    'explore.tabDistricts': 'सर्व ३६ जिल्हे आणि माहिती',
    'explore.tabHiddenGems': 'गुप्त ठिकाणे आणि अपरिचित स्पॉट्स',
    'explore.searchPlaceholder': 'जिल्हा, विभाग किंवा पर्यटन स्थळ शोधा...',
    'explore.filterDivision': 'सर्व विभाग',
    'explore.selectTaluka': 'सर्व तालुके',
    'explore.viewAttractions': 'पर्यटन स्थळे',
    'explore.viewHotels': 'हॉटेल्स आणि निवास',
    'explore.viewRestaurants': 'स्थानिक खाद्यसंस्कृती',
    'explore.liveWeather': 'थेट हवामान',
    'explore.weatherSafe': 'प्रवासासाठी अनुकूल',
    'explore.exploreDistrict': 'जिल्हा एक्सप्लोर करा',
    'explore.planForDistrict': 'या जिल्ह्यात सहल आखा',

    // Planner Section
    'planner.title': 'महाट्रिप एआय सहल नियोजक',
    'planner.subtitle': 'तुमचे वाहन, बजेट, प्रवासी आणि हवामानानुसार वैयक्तिकृत सहल आराखडा.',
    'planner.startCity': 'सुरुवातीचे शहर',
    'planner.startingDistrict': 'प्रारंभिक जिल्हा',
    'planner.findLocationIn': 'या जिल्ह्यातील ठिकाण शोधा',
    'planner.locationsAvailable': 'उपलब्ध ठिकाणे',
    'planner.matchingLocations': 'या जिल्ह्यातील ठिकाणे',
    'planner.popularSpots': 'लोकप्रिय ठिकाणे',
    'planner.startingFrom': 'येथून सुरुवात',
    'planner.fetchDistricts': 'जिल्हे लोड करा',
    'planner.filterByDistrict': 'जिल्ह्यानुसार निवडा',
    'planner.allMaharashtra': 'संपूर्ण महाराष्ट्र',
    'planner.duration': 'सहलीचा कालावधी',
    'planner.oneDayReturn': '१ दिवस (परतीचा प्रवास)',
    'planner.multiDay': 'अनेक दिवसांची फेरी',
    'planner.groupType': 'प्रवासी प्रकार',
    'planner.budgetTier': 'बजेट वर्ग',
    'planner.budgetBudget': 'किफायतशीर (₹१,५००/दिवस)',
    'planner.budgetModerate': 'मध्यम (₹३,०००/दिवस)',
    'planner.budgetComfort': 'आरामदायी (₹५,५००/दिवस)',
    'planner.generateBtn': 'एआय सहल आराखडा तयार करा',
    'planner.saveBtn': 'सहल डॅशबोर्डवर जतन करा',
    'planner.generating': 'मार्ग, हवामान आणि स्थानिक थांब्यांची गणना करत आहे...',

    // Help & Safety
    'help.title': 'महाराष्ट्र प्रवास सुरक्षा आणि आणीबाणी सेवा',
    'help.subtitle': 'अधिकृत आणीबाणी संपर्क क्रमांक, वैद्यकीय मदत, पोलीस ठाणी आणि पावसाळी सुरक्षा सतर्कता.',
    'help.emergency112': 'भारत आणीबाणी (पोलीस, अग्निशामक, रुग्णवाहिका): ११२',
    'help.mtdc': 'एमटीडीसी पर्यटक हेल्पलाईन: १८००-२२९-९३०',
    'help.highwayPolice': 'महाराष्ट्र महामार्ग पोलीस: ९८२२४ ९८२२४',
    'help.trustedContact': 'तुमचा विश्वासू आणीबाणी संपर्क',
    'help.saveContact': 'संपर्क जतन करा',

    // Dashboard / My Trips
    'dash.title': 'प्रवासी डॅशबोर्ड',
    'dash.savedTrips': 'जतन केलेल्या सहली',
    'dash.favorites': 'आवडती पर्यटन स्थळे',
    'dash.expenseTracker': 'ग्रुप खर्च ट्रॅकर',
    'dash.noTrips': 'अद्याप कोणतीही सहल जतन केलेली नाही. नवीन सहल आखण्यासाठी "सहल नियोजन" वापरा!',

    // Modals & Auth
    'auth.signInTitle': 'महाराष्ट्र एक्सप्लोरर मध्ये साइन इन करा',
    'auth.registerTitle': 'नवीन प्रवासी खाते तयार करा',
    'auth.subtitle': 'एआय सहली जतन करा, ग्रुप खर्च नोंदवा आणि सुरक्षा संपर्क ठेवा.',
    'auth.fullName': 'पूर्ण नाव',
    'auth.homeCity': 'गृह शहर',
    'auth.phone': 'फोन नंबर',
    'auth.email': 'ईमेल पत्ता',
    'auth.password': 'पासवर्ड',
    'auth.submitLogin': 'साइन इन करा',
    'auth.submitRegister': 'खाते तयार करा',
    'auth.needAccount': 'खाते नाही? नोंदणी करा',
    'auth.haveAccount': 'आधीच खाते आहे? साइन इन करा',
    'auth.demoBtn': 'डेमो खाते भरा',

    // Detail Modal
    'detail.bestTime': 'भेट देण्याची उत्तम वेळ',
    'detail.timings': 'वेळ आणि प्रवेश शुल्क',
    'detail.highlights': 'प्रमुख वैशिष्ट्ये आणि आकर्षणे',
    'detail.howToReach': 'कसे पोहोचावे',
    'detail.planTrip': 'येथे सहल आयोजित करा',
    'detail.close': 'बंद करा',

    // Footer
    'footer.brand': 'महाराष्ट्र एक्सप्लोरर · महाट्रिप एआय द्वारे समर्थित',
    'footer.motto': 'महाराष्ट्र अनुभवा · स्मार्ट नियोजन करा · तुमच्या बजेटमध्ये प्रवास करा.',
    'footer.emergency': 'भारत आणीबाणी: ११२',
    'footer.helpline': 'एमटीडीसी हेल्पलाईन: १८००-२२९-९३०'
  },

  hi: {
    // Brand & Header
    'brand.title': 'महाराष्ट्र',
    'brand.highlight': 'एक्सप्लोरर',
    'brand.sub': 'महाट्रिप एआई',
    'nav.home': 'मुख्य पृष्ठ',
    'nav.planner': 'यात्रा योजना',
    'nav.explore': 'अन्वेषण करें',
    'nav.dashboard': 'मेरी यात्राएं',
    'nav.help': 'सहायता और सुरक्षा',
    'nav.signIn': 'साइन इन',
    'nav.signOut': 'साइन आउट',
    'nav.myAccount': 'मेरा खाता',
    'nav.toggleMenu': 'नेविगेशन मेनू टॉगल करें',
    'nav.language': 'भाषा',
    'nav.chooseLanguage': 'भाषा चुनें',

    // Hero Section
    'hero.badge': 'महाराष्ट्र एक्सप्लोरर · महाट्रिप एआई',
    'hero.titlePre': 'सभी 36 जिलों में',
    'hero.titleHighlight': 'संपूर्ण यात्राएं',
    'hero.description': 'अपने वास्तविक ग्रुप बजट के अनुसार 1-दिवसीय या बहु-दिवसीय महाराष्ट्र सर्किट की योजना बनाएं — सटीक समय, ईंधन गणना और प्रामाणिक स्थलों के साथ।',
    'hero.btnPlan': 'यात्रा की योजना बनाएं (1-दिन या बहु-दिन)',
    'hero.btnExplore': 'महाराष्ट्र का अन्वेषण करें',

    // Popular Destinations Section
    'home.curatedTag': 'प्रमुख चयनित पर्यटन स्थल',
    'home.popularHeading': 'महाराष्ट्र के लोकप्रिय पर्यटन स्थल',
    'home.viewAllDistricts': 'सभी 36 जिले देखें',
    'home.detailsBtn': 'विवरण',
    'home.planTripBtn': 'प्लान बनाएं',
    'home.est': 'अनुमानित',
    'home.perPerson': '/व्यक्ति',
    'home.goodFor1Day': '1 दिन के लिए उपयुक्त',
    'home.days': 'दिन',

    // Categories
    'cat.All': 'सभी',
    'cat.Fort': 'किले',
    'cat.Cave': 'गुफाएं',
    'cat.Beach': 'समुद्र तट',
    'cat.Hill Station': 'हिल स्टेशन',
    'cat.Temple': 'मंदिर',
    'cat.Wildlife': 'वन्यजीव',
    'cat.Nature': 'प्रकृति',
    'cat.Waterfall': 'झरने',
    'cat.Pilgrimage': 'तीर्थस्थल',

    // Hidden Gems Section
    'gems.tag': 'ऑफबीट पर्यटन',
    'gems.heading': 'शांत दृश्य स्थल और अनूठी जगहें',
    'gems.exploreBtn': 'गुप्त स्थल देखें',
    'gems.permitAlert': 'अनुमति जांच आवश्यक',
    'gems.safetyNotes': 'सुरक्षा विवरण व नियम →',

    // 6 Administrative Divisions
    'divisions.heading': 'क्षेत्र के अनुसार देखें (6 प्रभाग)',
    'divisions.subtitle': 'महाराष्ट्र के 36 जिलों, तालुकों और ट्रेन/बस कनेक्टिविटी की पूरी जानकारी प्राप्त करें।',
    'divisions.division': 'प्रभाग',
    'divisions.districts': 'जिले',

    // Explore Maharashtra Section
    'explore.tabDistricts': 'सभी 36 जिले और विवरण',
    'explore.tabHiddenGems': 'गुप्त जगहें और ऑफबीट स्थल',
    'explore.searchPlaceholder': 'जिले, प्रभाग या पर्यटन स्थल से खोजें...',
    'explore.filterDivision': 'सभी प्रभाग',
    'explore.selectTaluka': 'सभी तालुका',
    'explore.viewAttractions': 'पर्यटन स्थल',
    'explore.viewHotels': 'होटल और विश्राम गृह',
    'explore.viewRestaurants': 'प्रामाणिक खानपान',
    'explore.liveWeather': 'लाइव मौसम',
    'explore.weatherSafe': 'यात्रा के लिए अनुकूल',
    'explore.exploreDistrict': 'जिला देखें',
    'explore.planForDistrict': 'इस जिले की यात्रा बनाएं',

    // Planner Section
    'planner.title': 'महाट्रिप एआई ट्रिप प्लानर',
    'planner.subtitle': 'आपके वाहन, बजट, यात्रियों और मौसम के अनुकूल यात्रा कार्यक्रम।',
    'planner.startCity': 'शुरुआती शहर',
    'planner.startingDistrict': 'शुरुआती जिला',
    'planner.findLocationIn': 'इस जिले का स्थान खोजें',
    'planner.locationsAvailable': 'उपलब्ध स्थल',
    'planner.matchingLocations': 'इस जिले के स्थान',
    'planner.popularSpots': 'लोकप्रिय स्थल',
    'planner.startingFrom': 'शुरुआती स्थान',
    'planner.fetchDistricts': 'जिले लोड करें',
    'planner.filterByDistrict': 'जिले अनुसार चुनें',
    'planner.allMaharashtra': 'संपूर्ण महाराष्ट्र',
    'planner.duration': 'यात्रा की अवधि',
    'planner.oneDayReturn': '1 दिन (वापसी यात्रा)',
    'planner.multiDay': 'बहु-दिवसीय परिपथ',
    'planner.groupType': 'यात्री समूह',
    'planner.budgetTier': 'बजट स्तर',
    'planner.budgetBudget': 'किफायती (₹1,500/दिन)',
    'planner.budgetModerate': 'मध्यम (₹3,000/दिन)',
    'planner.budgetComfort': 'आरामदायक (₹5,500/दिन)',
    'planner.generateBtn': 'एआई यात्रा कार्यक्रम बनाएं',
    'planner.saveBtn': 'यात्रा डैशबोर्ड में सहेजें',
    'planner.generating': 'मार्ग, मौसम और स्थानीय ठहराव की गणना की जा रही है...',

    // Help & Safety
    'help.title': 'महाराष्ट्र यात्रा सुरक्षा एवं आपातकालीन नेटवर्क',
    'help.subtitle': 'आपातकालीन नंबर, प्रमाणित गाइड, जिला हेल्पलाइन और मानसून सुरक्षा सुझाव।',
    'help.emergency112': 'भारत आपातकालीन (पुलिस, अग्निशमन, एम्बुलेंस): 112',
    'help.mtdc': 'एमटीडीसी पर्यटक हेल्पलाइन: 1800-229-930',
    'help.highwayPolice': 'महाराष्ट्र हाईवे पुलिस: 98224 98224',
    'help.trustedContact': 'आपका विश्वसनीय आपातकालीन संपर्क',
    'help.saveContact': 'संपर्क सहेजें',

    // Dashboard / My Trips
    'dash.title': 'यात्री डैशबोर्ड',
    'dash.savedTrips': 'सहेजी गई यात्राएं',
    'dash.favorites': 'पसंदीदा पर्यटन स्थल',
    'dash.expenseTracker': 'समूह खर्च ट्रैकर',
    'dash.noTrips': 'अभी तक कोई यात्रा सहेजी नहीं गई है। नई यात्रा बनाने के लिए "यात्रा योजना" पर जाएं!',

    // Modals & Auth
    'auth.signInTitle': 'महाराष्ट्र एक्सप्लोरर में साइन इन करें',
    'auth.registerTitle': 'नया यात्री खाता बनाएं',
    'auth.subtitle': 'एआई यात्राएं सहेजें, समूह खर्च दर्ज करें और विश्वसनीय संपर्क रखें।',
    'auth.fullName': 'पूरा नाम',
    'auth.homeCity': 'गृह नगर',
    'auth.phone': 'फ़ोन नंबर',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.submitLogin': 'साइन इन करें',
    'auth.submitRegister': 'खाता बनाएं',
    'auth.needAccount': 'खाता नहीं है? पंजीकरण करें',
    'auth.haveAccount': 'पहले से खाता है? साइन इन करें',
    'auth.demoBtn': 'डेमो खाता भरें',

    // Detail Modal
    'detail.bestTime': 'घूमने का सबसे अच्छा समय',
    'detail.timings': 'समय और प्रवेश शुल्क',
    'detail.highlights': 'मुख्य आकर्षण और गतिविधियां',
    'detail.howToReach': 'कैसे पहुंचें',
    'detail.planTrip': 'यहां की यात्रा बनाएं',
    'detail.close': 'बंद करें',

    // Footer
    'footer.brand': 'महाराष्ट्र एक्सप्लोरर · महाट्रिप एआई द्वारा संचालित',
    'footer.motto': 'महाराष्ट्र की खोज करें · स्मार्ट योजना बनाएं · अपने बजट में यात्रा करें।',
    'footer.emergency': 'भारत आपातकालीन: 112',
    'footer.helpline': 'एमटीडीसी हेल्पलाइन: 1800-229-930'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key
});

const STORAGE_KEY = 'maharashtra_explorer_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === 'en' || saved === 'mr' || saved === 'hi')) {
        return saved;
      }
    } catch {}
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {}
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    // Fallback to English if missing in target
    if (TRANSLATIONS.en && TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
