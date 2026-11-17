/**
 * ==========================================================================
 * Maharashtra Explorer - Destinations Mock Data & Logic
 * ==========================================================================
 */

const DESTINATIONS_DATA = [
  {
    id: 1,
    name: "Raigad Fort",
    category: "Forts",
    location: "Raigad District, Maharashtra",
    region: "Konkan / Sahyadri",
    budget: 3000,
    duration: 2,
    rating: 4.8,
    description: "A historic hill fort that served as the capital of the Maratha Empire under Chhatrapati Shivaji Maharaj. Perched at 2,700 ft in the Sahyadri mountains.",
    image: "https://images.unsplash.com/photo-1626014303757-65644775be48?auto=format&fit=crop&w=1000&q=80",
    bestTime: "October to March (Pleasant) & July to September (Misty Monsoon)",
    popularAttractions: [
      "Maha Darwaja (Grand Gateway)",
      "Raj Bhavan (Royal Palace Ruins)",
      "Takmak Tok (Execution Point Cliff)",
      "Jagdishwar Temple",
      "Samadhi of Chhatrapati Shivaji Maharaj",
      "Raigad Ropeway"
    ],
    thingsToDo: [
      "Trek up the 1,400+ stone steps or take the scenic cable ropeway",
      "Witness panoramic views of the Sahyadri mountain ranges from Takmak Tok",
      "Pay homage at the sacred Samadhi of Shivaji Maharaj",
      "Explore the ancient grain silos, market street (Bazaar Peth), and queen's chambers",
      "Enjoy traditional Maharashtrian Pithla Bhakri and Kanda Bhaji at local dhabas"
    ],
    travelTips: [
      "Wear sturdy trekking shoes as the stone stairs can get slippery in monsoon.",
      "Carry ample drinking water and sun protection.",
      "The ropeway operates from 8:00 AM to 5:30 PM with minimal wait time on weekdays."
    ],
    nearbyDestinations: ["Mahad", "Harihareshwar Beach", "Shivthar Ghal"],
    tags: ["Historical Places", "Adventure", "Nature", "Mountains"]
  },
  {
    id: 2,
    name: "Sinhagad Fort",
    category: "Forts",
    location: "Pune District, Maharashtra",
    region: "Western Maharashtra",
    budget: 1500,
    duration: 1,
    rating: 4.7,
    description: "The 'Lion Fort' known for the heroic battle of Tanaji Malusare. A favorite weekend trekking and historical retreat overlooking the Khadakwasla Dam.",
    image: "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?auto=format&fit=crop&w=1000&q=80",
    bestTime: "July to February (Lush green monsoon & crisp winter)",
    popularAttractions: [
      "Tanaji Malusare Memorial & Samadhi",
      "Pune Darwaja and Kalyan Darwaja",
      "Kadelot Point (Cliff Edge)",
      "Amruteshwar Temple",
      "Wind Point (Hawa Point)"
    ],
    thingsToDo: [
      "Early morning trek from base village Donje to the summit",
      "Savor authentic hot Pithla Bhakri, Thecha, and Matka Dahi (curd)",
      "Enjoy views of Khadakwasla Dam backwaters and surrounding valleys",
      "Photography of monsoon clouds rolling over the battlements"
    ],
    travelTips: [
      "Shared jeeps operate from Donje village if you prefer not to climb the entire trail.",
      "Reach before 7:30 AM on weekends to avoid heavy tourist traffic.",
      "Respect the historical heritage and keep the fort litter-free."
    ],
    nearbyDestinations: ["Khadakwasla Dam", "Panshet Dam", "Pune City"],
    tags: ["Historical Places", "Adventure", "Food and Culture"]
  },
  {
    id: 3,
    name: "Mahabaleshwar",
    category: "Hill Stations",
    location: "Satara District, Maharashtra",
    region: "Western Maharashtra",
    budget: 8000,
    duration: 3,
    rating: 4.9,
    description: "The strawberry capital of India and Queen of Hill Stations in the Western Ghats, renowned for cascading viewpoints, serene lakes, and colonial architecture.",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
    bestTime: "October to June (Strawberry harvest & pleasant climate)",
    popularAttractions: [
      "Arthur's Seat (Queen of all viewpoints)",
      "Venna Lake (Boating & Horseriding)",
      "Mapro Garden (Fresh Strawberry with Cream)",
      "Elphinstone Point & Wilson Point (Sunrise)",
      "Old Mahabaleshwar Panchganga Temple"
    ],
    thingsToDo: [
      "Go boating in the misty waters of Venna Lake",
      "Pick fresh strawberries at local organic farms and enjoy fresh fruit cream",
      "Hike to Arthur's Seat for vertigo-inducing views of the Savitri valley",
      "Visit the 16th-century Mahabaleshwar Temple dedicated to Lord Shiva",
      "Buy handcrafted leather Kolhapuri chappals and locally made fruit crushes"
    ],
    travelTips: [
      "Evenings can get chilly between November and February; pack light woolens.",
      "Monsoons bring very heavy rainfall, ideal for waterfall chasers but foggy for viewpoints."
    ],
    nearbyDestinations: ["Panchgani", "Pratapgad Fort", "Tapola (Mini Kashmir)"],
    tags: ["Nature", "Mountains", "Food and Culture"]
  },
  {
    id: 4,
    name: "Lonavala & Khandala",
    category: "Hill Stations",
    location: "Pune District, Maharashtra",
    region: "Western Maharashtra",
    budget: 5000,
    duration: 2,
    rating: 4.6,
    description: "A scenic twin hill retreat nestled between Mumbai and Pune, dotted with emerald green valleys, historical caves, waterfalls, and world-famous chikki.",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80",
    bestTime: "July to March (Spectacular monsoon waterfalls)",
    popularAttractions: [
      "Tiger's Leap (Tiger Point)",
      "Bhushi Dam & Pawna Lake",
      "Karla & Bhaja Buddhist Caves",
      "Rajmachi Point & Fort",
      "Lohagad Fort"
    ],
    thingsToDo: [
      "Watch dramatic mist rising at Tiger Point with steaming hot ginger tea & corn pakodas",
      "Camp under the stars beside Pawna Lake with campfire and BBQ",
      "Explore the 2nd-century BC rock-cut Buddhist chaityas at Karla Caves",
      "Sample a variety of traditional Maganlal Chikki and fudges"
    ],
    travelTips: [
      "Conveniently connected by Mumbai-Pune expressway and local train network.",
      "Pawna Lake camping bookings are best reserved a week in advance."
    ],
    nearbyDestinations: ["Pawna Lake", "Khandala", "Karla Caves"],
    tags: ["Nature", "Adventure", "Mountains", "Food and Culture"]
  },
  {
    id: 5,
    name: "Alibaug",
    category: "Beaches",
    location: "Raigad District, Maharashtra",
    region: "Konkan Coast",
    budget: 4500,
    duration: 2,
    rating: 4.5,
    description: "A popular coastal getaway offering golden sandy shores, historic sea forts, water sports, and mouth-watering authentic Konkani seafood.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
    bestTime: "October to May (Clear skies, sunny beaches & water sports)",
    popularAttractions: [
      "Kolaba Fort (Sea Fort accessible during low tide)",
      "Varsoli Beach & Nagaon Beach",
      "Kashid Beach (White sands)",
      "Kanakeshwar Hill Temple",
      "Murud-Janjira Fort"
    ],
    thingsToDo: [
      "Walk or take a horse-cart through the shallow sea to Kolaba Fort during low tide",
      "Enjoy thrilling water sports: jet-skiing, banana rides, and parasailing at Nagaon Beach",
      "Feast on authentic Surmai thali, Solkadhi, and Crab Masala at local coastal eateries",
      "Relax in beachfront luxury villas and homestays surrounded by coconut groves"
    ],
    travelTips: [
      "Speedboats and Ro-Ro car ferries from Bhaucha Dhakka / Gateway of India (Mumbai) reach Mandwa jetty in 45-60 minutes.",
      "Check tide timings before visiting Kolaba Sea Fort."
    ],
    nearbyDestinations: ["Kashid Beach", "Murud Janjira", "Revdanda Beach"],
    tags: ["Beaches", "Adventure", "Food and Culture", "Historical Places"]
  },
  {
    id: 6,
    name: "Tarkarli",
    category: "Beaches",
    location: "Sindhudurg District, Maharashtra",
    region: "Southern Konkan",
    budget: 7500,
    duration: 3,
    rating: 4.9,
    description: "Famous for crystal-clear turquoise waters, pristine coral reefs, scuba diving, dolphin safaris, and rich Malvani culinary culture.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80",
    bestTime: "October to April (Best underwater visibility for scuba diving)",
    popularAttractions: [
      "Tarkarli Beach & Devbagh Sangam (Sea meets River Karli)",
      "Sindhudurg Fort (Chhatrapati Shivaji Maharaj's Sea Citadel)",
      "Tsunami Island (Water sports center)",
      "Nivati Beach & Lighthouse",
      "Dolphin Safari Spot"
    ],
    thingsToDo: [
      "Experience certified scuba diving and snorkeling over vibrant coral beds",
      "Take a traditional boat cruise along Karli River backwaters to Devbagh",
      "Spot playful Indo-Pacific dolphins during early morning boat safaris",
      "Visit the iconic Sindhudurg Fort located on a rocky islet in the Arabian Sea",
      "Indulge in authentic Malvani Fish Curry, Kombdi Vade, and freshly made Solkadhi"
    ],
    travelTips: [
      "Nearest railway station is Kudal / Sindhudurg; nearest airport is Chipi Airport (Sindhudurg).",
      "Advance booking for scuba diving is recommended on holiday weekends."
    ],
    nearbyDestinations: ["Malvan", "Sindhudurg Fort", "Vengurla"],
    tags: ["Beaches", "Adventure", "Nature", "Food and Culture"]
  },
  {
    id: 7,
    name: "Matheran",
    category: "Hill Stations",
    location: "Raigad District, Maharashtra",
    region: "Western Ghats",
    budget: 3500,
    duration: 2,
    rating: 4.8,
    description: "Asia's only eco-sensitive, automobile-free hill station. Enjoy fresh unpolluted air, heritage toy train rides, red mud pathways, and 38 breathtaking viewpoints.",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80",
    bestTime: "September to May (Crisp weather & vibrant greenery)",
    popularAttractions: [
      "Panorama Point (360-degree sunrise view)",
      "Louisa Point & Echo Point",
      "Charlotte Lake (Source of drinking water)",
      "One Tree Hill Point",
      "Neral-Matheran Heritage Toy Train"
    ],
    thingsToDo: [
      "Ride the charming narrow-gauge heritage toy train or ride on horseback",
      "Hike leisurely along quiet, red-earth trails flanked by evergreen canopy",
      "Experience the incredible acoustic reflection at Echo Point",
      "Watch scenic sunsets over Prabal fort from Porcupine Point",
      "Buy handcrafted leather sandals and freshly made chikki from the local bazaar"
    ],
    travelTips: [
      "Vehicles are banned past Dasturi Naka parking point; enter on foot, horseback, or hand-pulled rickshaw.",
      "Beware of mischievous monkeys; keep food packets concealed in your bag."
    ],
    nearbyDestinations: ["Neral", "Prabalmachi", "Karjat"],
    tags: ["Nature", "Mountains", "Adventure"]
  },
  {
    id: 8,
    name: "Ajanta Caves",
    category: "Caves",
    location: "Chhatrapati Sambhajinagar (Aurangabad), Maharashtra",
    region: "Marathwada",
    budget: 6000,
    duration: 2,
    rating: 4.9,
    description: "UNESCO World Heritage Site consisting of 30 rock-cut Buddhist cave monuments dating from the 2nd century BCE, holding masterpieces of ancient religious art.",
    image: "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1000&q=80",
    bestTime: "November to March (Pleasant weather for exploration)",
    popularAttractions: [
      "Cave 1 & 2 (Preserved fresco murals of Padmapani and Vajrapani)",
      "Cave 19 & 26 (Magnificent Chaitya halls with carved stupas & reclining Buddha)",
      "Waghora River Gorge & Ajanta Viewpoint"
    ],
    thingsToDo: [
      "Marvel at ancient tempera painting techniques that survived over 2,000 years",
      "Climb to the scenic Ajanta View Point where British officer John Smith rediscovered the caves in 1819",
      "Learn about the Jataka tales depicted in rock-carved murals with authorized guides",
      "Explore the architectural evolution from Hinayana to Mahayana Buddhism"
    ],
    travelTips: [
      "Ajanta Caves are closed on Mondays; plan your visit accordingly.",
      "Eco-friendly shuttle buses operate from the T-point visitor center to the caves.",
      "Carry a small flashlight to appreciate fine mural details in dimly lit chambers."
    ],
    nearbyDestinations: ["Ellora Caves", "Bibi Ka Maqbara", "Daulatabad Fort"],
    tags: ["Historical Places", "Religious Places", "Heritage Places"]
  },
  {
    id: 9,
    name: "Ellora Caves",
    category: "Caves",
    location: "Chhatrapati Sambhajinagar (Aurangabad), Maharashtra",
    region: "Marathwada",
    budget: 5500,
    duration: 2,
    rating: 4.9,
    description: "UNESCO World Heritage Site with 34 monolithic rock-cut temples representing Buddhist, Hindu, and Jain monuments. Home to the legendary Kailasa Temple (Cave 16).",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80",
    bestTime: "October to March",
    popularAttractions: [
      "Cave 16: The Kailasa Temple (World's largest single rock excavation)",
      "Cave 10: Carpenter's Cave (Visvakarma Chaitya)",
      "Cave 29: Dhumar Lena",
      "Cave 32: Indra Sabha (Jain cave with exquisite carving)",
      "Grishneshwar Jyotirlinga Temple (Nearby)"
    ],
    thingsToDo: [
      "Stand in awe inside Kailasa Temple, carved top-down from a single monolithic basalt rock",
      "Visit Grishneshwar, one of the 12 sacred Jyotirlinga shrines in India, just 1 km away",
      "Explore the multi-faith coexistence expressed in centuries-old rock architecture",
      "Visit the nearby medieval fortress of Daulatabad (Devagiri)"
    ],
    travelTips: [
      "Ellora Caves are closed on Tuesdays.",
      "Wear comfortable walking shoes; the cave complex spans over 2 kilometers.",
      "Battery-operated electric carts are available inside the monument complex."
    ],
    nearbyDestinations: ["Grishneshwar Temple", "Daulatabad Fort", "Ajanta Caves"],
    tags: ["Historical Places", "Religious Places", "Heritage Places"]
  },
  {
    id: 10,
    name: "Tadoba-Andhari Tiger Reserve",
    category: "Wildlife",
    location: "Chandrapur District, Maharashtra",
    region: "Vidarbha",
    budget: 9500,
    duration: 3,
    rating: 4.9,
    description: "Maharashtra's oldest and largest national park, famously nicknamed 'The Jewel of Vidarbha', celebrated worldwide for frequent Royal Bengal Tiger sightings.",
    image: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1000&q=80",
    bestTime: "October to June (March to May offers highest tiger sighting probability near waterholes)",
    popularAttractions: [
      "Moharli, Kolara, and Navegaon Safari Core Gates",
      "Tadoba Lake (Crocodiles and migratory birds)",
      "Andhari River & Bamboo thickets",
      "Telia & Maya Tiger territory zones"
    ],
    thingsToDo: [
      "Embark on open 4x4 Gypsy jungle safaris during sunrise and dusk",
      "Track majestic Royal Bengal Tigers, leopards, sloth bears, Indian wild dogs (dholes), and gaurs",
      "Birdwatching for crested serpent eagles, paradise flycatchers, and pied kingfishers",
      "Stay in eco-resorts with evening naturalist talks and tribal cultural performances"
    ],
    travelTips: [
      "Book safari permits 60 to 120 days in advance via the official Maharashtra Eco-tourism portal.",
      "Carry valid government photo ID matching your safari permit.",
      "Opt for muted, earth-toned clothing (khaki, olive, brown) to blend into the jungle."
    ],
    nearbyDestinations: ["Chandrapur", "Pench National Park", "Nagpur"],
    tags: ["Wildlife", "Nature", "Adventure"]
  },
  {
    id: 11,
    name: "Pratapgad Fort",
    category: "Forts",
    location: "Satara District, Maharashtra",
    region: "Western Ghats",
    budget: 2500,
    duration: 1,
    rating: 4.7,
    description: "The invincible fortress where the historic encounter between Chhatrapati Shivaji Maharaj and Afzal Khan took place in 1659. Offers dramatic views over the Koyna valley.",
    image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1000&q=80",
    bestTime: "October to April (Cool breeze & clear views)",
    popularAttractions: [
      "Bhavani Mata Temple",
      "Afzal Khan Tomb",
      "Equestrian Statue of Shivaji Maharaj",
      "Bale Killa (Upper citadel)",
      "Tehalni Buruj (Watchtower)"
    ],
    thingsToDo: [
      "Walk the fortified ramparts overlooking lush Mahabaleshwar forest ranges",
      "Visit the sacred temple of Goddess Bhavani consecrated by Shivaji Maharaj",
      "Listen to gripping historical narrations by registered local guides",
      "Taste locally made fresh Mahabaleshwar fruit jams and honey"
    ],
    travelTips: [
      "Located just 22 km from Mahabaleshwar town; easily combined in a day trip.",
      "There are around 450 easy stone steps to reach the top citadel."
    ],
    nearbyDestinations: ["Mahabaleshwar", "Panchgani", "Wai"],
    tags: ["Historical Places", "Mountains", "Adventure"]
  },
  {
    id: 12,
    name: "Ganpatipule",
    category: "Temples",
    location: "Ratnagiri District, Maharashtra",
    region: "Konkan Coast",
    budget: 5000,
    duration: 2,
    rating: 4.8,
    description: "A serene coastal pilgrimage town featuring a 400-year-old self-manifested (Swayambhu) Ganpati idol situated right along a pristine white-sand beach.",
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80",
    bestTime: "October to March",
    popularAttractions: [
      "Swayambhu Ganpati Beach Temple",
      "Aare Ware Twin Beach Drive",
      "Prachin Konkan Museum (Life-size cultural museum)",
      "Jaigad Fort & Jaigad Lighthouse",
      "Malgund (Birthplace of poet Keshavsut)"
    ],
    thingsToDo: [
      "Perform Pradakshina (circumambulation) around the hillock behind the sea-facing temple",
      "Drive along the breathtaking marine cliff road of Aare Ware",
      "Enjoy camel rides, horse buggies, and water sports at Ganpatipule beach",
      "Savor authentic Ratnagiri Alphonso mango delicacies (in season) and Modak prasad"
    ],
    travelTips: [
      "Modest traditional dress is recommended while visiting the temple sanctum.",
      "Nearest major rail junction is Ratnagiri (approx. 30 km away)."
    ],
    nearbyDestinations: ["Ratnagiri", "Jaigad Fort", "Guhagar Beach"],
    tags: ["Religious Places", "Beaches", "Food and Culture"]
  },
  {
    id: 13,
    name: "Thoseghar Waterfalls",
    category: "Waterfalls",
    location: "Satara District, Maharashtra",
    region: "Western Ghats",
    budget: 2000,
    duration: 1,
    rating: 4.7,
    description: "A spectacular series of waterfalls ranging from 15 meters to 500 meters high, plunging through dense rainforests into a deep scenic canyon near Satara.",
    image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1000&q=80",
    bestTime: "July to November (Peak volume during monsoon & post-monsoon)",
    popularAttractions: [
      "Main Chhota (Small) & Bada (Big) Waterfall Viewpoints",
      "Chalkewadi Windmill Plateau",
      "Kaas Plateau - Valley of Flowers (UNESCO)",
      "Sajjangad Fort (Samadhi of Saint Ramdas)"
    ],
    thingsToDo: [
      "Stand at the secure viewing gallery to feel the cold mist from the 500m plunge",
      "Combine your trip with the UNESCO Kaas Plateau flower bloom in August-September",
      "Visit the massive wind turbines spinning over Chalkewadi windmill hills",
      "Enjoy traditional Satara Kandi Pedhe sweets on your return"
    ],
    travelTips: [
      "Swimming in the gorge is strictly prohibited for safety reasons.",
      "Well-paved walking paths and railings make it accessible for families and senior citizens."
    ],
    nearbyDestinations: ["Kaas Plateau", "Sajjangad Fort", "Satara City"],
    tags: ["Waterfalls", "Nature", "Adventure"]
  },
  {
    id: 14,
    name: "Trimbakeshwar & Nashik",
    category: "Temples",
    location: "Nashik District, Maharashtra",
    region: "Northern Maharashtra / Khandesh",
    budget: 4500,
    duration: 2,
    rating: 4.8,
    description: "One of the twelve sacred Jyotirlingas, source of the holy River Godavari at the foothills of Brahmagiri mountain, surrounded by ancient temples and wine country.",
    image: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1000&q=80",
    bestTime: "September to March",
    popularAttractions: [
      "Trimbakeshwar Shiva Jyotirlinga Temple",
      "Kushavarta Kund (Sacred pond)",
      "Brahmagiri Hill & Gangadwar Trek",
      "Panchavati & Ramkund in Nashik",
      "Sula Vineyards (Wine tourism capital of India)"
    ],
    thingsToDo: [
      "Perform morning puja at the black stone architecture of Trimbakeshwar",
      "Trek up the 750 stone steps of Brahmagiri to see the origin of Godavari River",
      "Visit historic Panchavati, Sita Gumpha, and Kalaram Temple in Nashik",
      "Tour India's finest vineyards for grape crushing and wine tasting sessions"
    ],
    travelTips: [
      "Special VIP darshan passes can be arranged online to reduce queue times on festive days.",
      "Nashik is easily reachable in 3 hours by train or expressway from Mumbai."
    ],
    nearbyDestinations: ["Shirdi", "Igatpuri", "Bhandardara"],
    tags: ["Religious Places", "Historical Places", "Food and Culture"]
  },
  {
    id: 15,
    name: "Bhandardara & Sandhan Valley",
    category: "Waterfalls",
    location: "Ahmednagar District, Maharashtra",
    region: "Sahyadri Ranges",
    budget: 3500,
    duration: 2,
    rating: 4.8,
    description: "A pristine holiday haven famous for Arthur Lake, Wilson Dam, Randha Falls, and the legendary Sandhan Valley 'Valley of Shadows' canyon trek.",
    image: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1000&q=80",
    bestTime: "June to October (Waterfalls & Fireflies festival in May-June)",
    popularAttractions: [
      "Randha Waterfalls & Umbrella Falls",
      "Arthur Lake & Wilson Dam",
      "Mount Kalsubai (Highest peak in Maharashtra, 1646m)",
      "Sandhan Valley Canyon",
      "Ratangad Fort"
    ],
    thingsToDo: [
      "Camp beside Arthur Lake under starry night skies",
      "Witness millions of glowing fireflies during the pre-monsoon Kajwa Mahotsav (May-June)",
      "Summit Mount Kalsubai to stand on the highest geographic point in Maharashtra",
      "Trek through the narrow 200-foot-deep rock defile of Sandhan Valley"
    ],
    travelTips: [
      "Pack warm clothing and quality sleeping bags if you plan overnight lakeside camping.",
      "Trek guides are essential when venturing deep into Sandhan Valley."
    ],
    nearbyDestinations: ["Igatpuri", "Kalsubai Peak", "Nashik"],
    tags: ["Waterfalls", "Nature", "Adventure", "Mountains"]
  },
  {
    id: 16,
    name: "Gateway of India & CSMT",
    category: "Heritage Places",
    location: "Mumbai, Maharashtra",
    region: "Konkan / Coastal Metro",
    budget: 4000,
    duration: 2,
    rating: 4.8,
    description: "Iconic architectural wonders representing India's Victorian Gothic and Indo-Saracenic colonial heritage alongside the bustling Arabian Sea harbour.",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1000&q=80",
    bestTime: "October to March (Pleasant coastal breezes)",
    popularAttractions: [
      "Gateway of India & Taj Mahal Palace Hotel",
      "Chhatrapati Shivaji Maharaj Terminus (UNESCO Site)",
      "Marine Drive (The Queen's Necklace)",
      "Elephanta Caves (1 hour ferry from Gateway)",
      "Kala Ghoda Art Precinct & Museums"
    ],
    thingsToDo: [
      "Take a heritage boat ferry from Gateway to the ancient rock-cut Elephanta Caves",
      "Walk along Marine Drive promenade at sunset while eating Mumbai Bhel Puri and Pav Bhaji",
      "Admire the stained glass and Gothic gargoyles of CSMT railway station",
      "Explore street art, cafes, and galleries in the vibrant Kala Ghoda neighborhood"
    ],
    travelTips: [
      "Mumbai local trains and metro offer the fastest way to travel across the city.",
      "The Taj Mahal Palace opposite the Gateway is wonderful for a classic afternoon high tea."
    ],
    nearbyDestinations: ["Alibaug", "Elephanta Caves", "Lonavala"],
    tags: ["Heritage Places", "Historical Places", "Food and Culture"]
  }
];

// Expose globally for API module & pages
window.DESTINATIONS_DATA = DESTINATIONS_DATA;

/**
 * Helper to get all categories and count
 */
function getDestinationCategories() {
  const categories = [
    { name: "Forts", icon: "🏰", count: 0 },
    { name: "Beaches", icon: "🏖", count: 0 },
    { name: "Hill Stations", icon: "⛰", count: 0 },
    { name: "Waterfalls", icon: "💧", count: 0 },
    { name: "Temples", icon: "🛕", count: 0 },
    { name: "Wildlife", icon: "🐅", count: 0 },
    { name: "Heritage Places", icon: "🏛", count: 0 },
    { name: "Caves", icon: "🕳", count: 0 }
  ];

  DESTINATIONS_DATA.forEach(dest => {
    const cat = categories.find(c => c.name.toLowerCase() === dest.category.toLowerCase());
    if (cat) cat.count++;
  });

  return categories;
}

/**
 * Generate standard HTML for a destination card
 */
function createDestinationCardHTML(dest) {
  return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="destination-card" id="dest-card-${dest.id}">
        <div class="destination-img-wrap">
          <img src="${dest.image}" alt="${dest.name}" class="destination-img" loading="lazy" />
          <span class="destination-category-badge">${dest.category}</span>
          <span class="destination-budget-badge">₹${dest.budget.toLocaleString()} / person</span>
        </div>
        <div class="destination-body">
          <div class="destination-location">
            <i class="fa-solid fa-location-dot text-danger"></i> ${dest.location}
          </div>
          <h3 class="destination-name">${dest.name}</h3>
          <p class="destination-desc">${dest.description}</p>
          <div class="destination-footer">
            <span class="destination-duration">
              <i class="fa-regular fa-clock me-1 text-primary"></i> ${dest.duration} Day${dest.duration > 1 ? 's' : ''} Tour
            </span>
            <a href="destination-details.html?id=${dest.id}" class="btn btn-sm btn-primary-custom" id="view-details-btn-${dest.id}">
              View Details <i class="fa-solid fa-arrow-right ms-1"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}
