/**
 * ==========================================================================
 * Maharashtra Explorer - Simulated Server API Service (Spring Boot Simulation)
 * ==========================================================================
 * 
 * This module simulates a complete Java Spring Boot REST API server response cycle.
 * It simulates:
 *   - Network latency / asynchronous delay (simulating HTTP roundtrip)
 *   - Standard Spring Boot ResponseEntity format ({ status, success, message, data, timestamp })
 *   - Demo User authentication (Spring Security / JWT mock token)
 *   - User profile retrieval & persistence (in-memory / localStorage MySQL table simulation)
 *   - User itinerary saving & deletion
 *   - Destination querying, filtering, and single retrieval
 *   - Travel agent inquiry dispatching
 *   - Intelligent trip planner recommendation computation
 * 
 * WHEN READY FOR REAL SPRING BOOT BACKEND:
 * Simply update `USE_MOCK_SERVER = false` and set `SPRING_BOOT_BASE_URL` to
 * your backend (e.g., http://localhost:8080/api).
 */

const USE_MOCK_SERVER = true;
const SPRING_BOOT_BASE_URL = "http://localhost:8080/api";

// Simulated Server Network Latency (in milliseconds)
const SIMULATED_LATENCY_MS = 250;

/**
 * Helper to simulate network latency with Promise delay
 */
function simulateNetworkDelay(ms = SIMULATED_LATENCY_MS) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Standard Spring Boot Server Response Wrapper Simulation
 */
function createServerResponse(status, message, data = null, errors = null) {
  return {
    status: status, // e.g. 200, 201, 400, 401, 404, 409, 500
    success: status >= 200 && status < 300,
    message: message,
    data: data,
    errors: errors,
    timestamp: new Date().toISOString()
  };
}

/**
 * ==========================================================================
 * DEMO USERS & DATABASE SIMULATION (Simulated MySQL Database)
 * ==========================================================================
 */

// Initial Demo Users in simulated MySQL DB
const INITIAL_DEMO_USERS = [
  {
    id: 101,
    fullName: "Rahul Patil",
    email: "demo.traveler@example.com",
    password: "Password123", // In real Spring Boot, this is BCrypt hashed
    phone: "+91 98220 12345",
    role: "ROLE_USER",
    tier: "Sahyadri Voyager (Gold)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    homeCity: "Pune, Maharashtra",
    interests: ["Forts", "Trekking", "Heritage", "Western Ghats"],
    registeredAt: "2026-01-15T10:30:00.000Z",
    savedItineraries: [
      {
        id: "ITN-101",
        title: "Raigad Fort Royal Expedition",
        destination: "Raigad Fort",
        days: 2,
        budget: 6000,
        travelers: 2,
        transport: "Private Car",
        createdDate: "2026-08-10"
      },
      {
        id: "ITN-102",
        title: "Tarkarli Scuba & Konkan Beach Retreat",
        destination: "Tarkarli Beach",
        days: 3,
        budget: 15000,
        travelers: 2,
        transport: "Train / AC Bus",
        createdDate: "2026-08-12"
      }
    ],
    inquiries: [
      {
        id: "INQ-782",
        agentName: "Sahyadri Heritage Treks & Tours",
        package: "Raigad & Shivneri Forts Weekend Expedition",
        status: "Confirmed by Agent",
        date: "2026-08-14"
      }
    ]
  },
  {
    id: 102,
    fullName: "Priya Deshmukh",
    email: "priya.tourist@example.com",
    password: "Password123",
    phone: "+91 98220 54321",
    role: "ROLE_USER",
    tier: "Konkan Coastal Explorer",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    homeCity: "Mumbai, Maharashtra",
    interests: ["Beaches", "Waterfalls", "Caves", "Photography"],
    registeredAt: "2026-02-10T14:20:00.000Z",
    savedItineraries: [
      {
        id: "ITN-103",
        title: "Ajanta & Ellora Caves UNESCO Heritage Tour",
        destination: "Ajanta Caves",
        days: 2,
        budget: 8500,
        travelers: 1,
        transport: "Train",
        createdDate: "2026-08-05"
      }
    ],
    inquiries: []
  }
];

// Helper to access simulated MySQL users table from localStorage
function getSimulatedUsersDB() {
  const stored = localStorage.getItem("maharashtra_explorer_users");
  if (!stored) {
    localStorage.setItem("maharashtra_explorer_users", JSON.stringify(INITIAL_DEMO_USERS));
    return INITIAL_DEMO_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_DEMO_USERS;
  }
}

function saveSimulatedUsersDB(users) {
  localStorage.setItem("maharashtra_explorer_users", JSON.stringify(users));
}

// In-Memory Simulated Inquiries DB
const SIMULATED_INQUIRIES = [];

/**
 * ==========================================================================
 * 1. AUTHENTICATION & USER PROFILE APIS (Spring Security & JWT)
 * ==========================================================================
 */

/**
 * Authenticate existing user
 * Simulated Spring Endpoint: POST /api/auth/login
 */
async function loginUserAPI(credentials) {
  console.log(`[HTTP POST] ${SPRING_BOOT_BASE_URL}/auth/login - Request:`, { email: credentials.email });

  if (!USE_MOCK_SERVER) {
    const response = await fetch(`${SPRING_BOOT_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });
    return await response.json();
  }

  // --- Simulated Server Logic ---
  await simulateNetworkDelay(280);

  const users = getSimulatedUsersDB();
  const user = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase().trim());

  if (!user) {
    return createServerResponse(404, "User account not found with provided email address.", null, ["ERR_USER_NOT_FOUND"]);
  }

  if (user.password !== credentials.password) {
    return createServerResponse(401, "Invalid password credentials.", null, ["ERR_INVALID_CREDENTIALS"]);
  }

  // Generate simulated JWT Auth Token
  const simulatedJwtToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDEiLCJlbWFpbCI6ImRlbW8udHJhdmVsZXJAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJST0xFX1VTRVIiXX0." + Math.random().toString(36).substring(2);

  const sessionData = {
    token: simulatedJwtToken,
    user: { ...user }
  };
  delete sessionData.user.password; // Do not expose password hash in response

  // Store active session token and user ID in localStorage
  localStorage.setItem("auth_token", simulatedJwtToken);
  localStorage.setItem("active_user_id", String(user.id));
  localStorage.setItem("active_user", JSON.stringify(sessionData.user));

  console.log(`[HTTP 200 OK] User authenticated successfully: ${user.fullName} (${user.email})`);
  return createServerResponse(200, "Authentication successful! Welcome back.", sessionData);
}

/**
 * Register a new user
 * Simulated Spring Endpoint: POST /api/auth/register
 */
async function registerUserAPI(userData) {
  console.log(`[HTTP POST] ${SPRING_BOOT_BASE_URL}/auth/register - Request:`, {
    fullName: userData.fullName,
    email: userData.email,
    phone: userData.phone
  });

  if (!USE_MOCK_SERVER) {
    const response = await fetch(`${SPRING_BOOT_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    return await response.json();
  }

  // --- Simulated Server Logic ---
  await simulateNetworkDelay(320);

  const users = getSimulatedUsersDB();
  const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());

  if (existingUser) {
    return createServerResponse(409, "An account with this email address already exists. Please sign in.", null, ["ERR_EMAIL_EXISTS"]);
  }

  const newUser = {
    id: 100 + users.length + 1,
    fullName: userData.fullName,
    email: userData.email.trim(),
    password: userData.password,
    phone: userData.phone,
    role: "ROLE_USER",
    tier: "Maharashtra Explorer (Novice)",
    homeCity: "Maharashtra, India",
    interests: ["Heritage", "Forts", "Beaches"],
    registeredAt: new Date().toISOString(),
    savedItineraries: [],
    inquiries: []
  };

  users.push(newUser);
  saveSimulatedUsersDB(users);

  console.log(`[HTTP 201 Created] New user persisted in MySQL simulation:`, newUser);
  return createServerResponse(201, "Account created successfully! You can now log in.", {
    userId: newUser.id,
    fullName: newUser.fullName,
    email: newUser.email
  });
}

/**
 * Get Current Logged-in User Profile
 * Simulated Spring Endpoint: GET /api/user/profile
 */
async function getCurrentUserAPI() {
  console.log(`[HTTP GET] ${SPRING_BOOT_BASE_URL}/user/profile`);

  if (!USE_MOCK_SERVER) {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${SPRING_BOOT_BASE_URL}/user/profile`, {
      headers: { "Authorization": token || "" }
    });
    return await response.json();
  }

  await simulateNetworkDelay(120);

  const activeUserId = localStorage.getItem("active_user_id");
  const storedUserJson = localStorage.getItem("active_user");

  if (!activeUserId && !storedUserJson) {
    return createServerResponse(401, "No active user session found. Please sign in.", null);
  }

  const users = getSimulatedUsersDB();
  let user = users.find(u => String(u.id) === String(activeUserId));

  if (!user && storedUserJson) {
    try {
      const parsed = JSON.parse(storedUserJson);
      user = users.find(u => u.email.toLowerCase() === parsed.email.toLowerCase());
      if (!user) user = parsed;
    } catch (e) {
      console.error(e);
    }
  }

  if (!user) {
    return createServerResponse(404, "User profile not found in database.", null);
  }

  const safeProfile = { ...user };
  delete safeProfile.password;

  return createServerResponse(200, "User profile fetched successfully", safeProfile);
}

/**
 * Save Itinerary to User Profile
 * Simulated Spring Endpoint: POST /api/user/itineraries
 */
async function saveUserItineraryAPI(itineraryData) {
  console.log(`[HTTP POST] ${SPRING_BOOT_BASE_URL}/user/itineraries - Body:`, itineraryData);

  if (!USE_MOCK_SERVER) {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${SPRING_BOOT_BASE_URL}/user/itineraries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token || ""
      },
      body: JSON.stringify(itineraryData)
    });
    return await response.json();
  }

  await simulateNetworkDelay(200);

  const activeUserId = localStorage.getItem("active_user_id") || "101";
  const users = getSimulatedUsersDB();
  const user = users.find(u => String(u.id) === String(activeUserId));

  const newItinerary = {
    id: "ITN-" + Math.floor(100 + Math.random() * 900),
    title: itineraryData.title || `${itineraryData.destination} Trip`,
    destination: itineraryData.destination || "Maharashtra Destination",
    days: itineraryData.days || 2,
    budget: itineraryData.budget || 5000,
    travelers: itineraryData.travelers || 1,
    transport: itineraryData.transport || "Road",
    createdDate: new Date().toISOString().split("T")[0]
  };

  if (user) {
    if (!user.savedItineraries) user.savedItineraries = [];
    user.savedItineraries.unshift(newItinerary);
    saveSimulatedUsersDB(users);
    localStorage.setItem("active_user", JSON.stringify(user));
  }

  return createServerResponse(201, "Itinerary saved to your user profile.", newItinerary);
}

/**
 * Delete Itinerary from User Profile
 * Simulated Spring Endpoint: DELETE /api/user/itineraries/{id}
 */
async function deleteUserItineraryAPI(itineraryId) {
  console.log(`[HTTP DELETE] ${SPRING_BOOT_BASE_URL}/user/itineraries/${itineraryId}`);

  await simulateNetworkDelay(180);

  const activeUserId = localStorage.getItem("active_user_id") || "101";
  const users = getSimulatedUsersDB();
  const user = users.find(u => String(u.id) === String(activeUserId));

  if (user && user.savedItineraries) {
    user.savedItineraries = user.savedItineraries.filter(itn => itn.id !== itineraryId);
    saveSimulatedUsersDB(users);
    localStorage.setItem("active_user", JSON.stringify(user));
    return createServerResponse(200, "Itinerary deleted successfully.", { id: itineraryId });
  }

  return createServerResponse(404, "Itinerary not found.", null);
}

/**
 * Log out user session
 * Simulated Spring Endpoint: POST /api/auth/logout
 */
async function logoutUserAPI() {
  console.log(`[HTTP POST] ${SPRING_BOOT_BASE_URL}/auth/logout`);
  await simulateNetworkDelay(100);
  localStorage.removeItem("auth_token");
  localStorage.removeItem("active_user_id");
  localStorage.removeItem("active_user");
  console.log("[Auth] User session terminated.");
  return createServerResponse(200, "Successfully logged out.");
}

/**
 * ==========================================================================
 * 2. DESTINATIONS APIS (Spring Boot DestinationController)
 * ==========================================================================
 */

/**
 * Fetch all tourist destinations
 * Simulated Spring Endpoint: GET /api/destinations
 */
async function getDestinations() {
  console.log(`[HTTP GET] ${SPRING_BOOT_BASE_URL}/destinations`);

  if (!USE_MOCK_SERVER) {
    const response = await fetch(`${SPRING_BOOT_BASE_URL}/destinations`);
    return await response.json();
  }

  await simulateNetworkDelay(150);
  const data = window.DESTINATIONS_DATA || [];
  return createServerResponse(200, `Retrieved ${data.length} destinations`, data);
}

/**
 * Fetch a single destination by its ID
 * Simulated Spring Endpoint: GET /api/destinations/{id}
 */
async function getDestinationById(id) {
  console.log(`[HTTP GET] ${SPRING_BOOT_BASE_URL}/destinations/${id}`);

  if (!USE_MOCK_SERVER) {
    const response = await fetch(`${SPRING_BOOT_BASE_URL}/destinations/${id}`);
    return await response.json();
  }

  await simulateNetworkDelay(120);
  const allDest = window.DESTINATIONS_DATA || [];
  const found = allDest.find(d => d.id === Number(id));

  if (!found) {
    return createServerResponse(404, `Destination with ID ${id} not found in database.`, null);
  }

  return createServerResponse(200, `Destination details for ${found.name}`, found);
}

/**
 * Filter destinations on server
 * Simulated Spring Endpoint: GET /api/destinations/filter?category=...&budget=...&region=...
 */
async function filterDestinationsAPI(filters = {}) {
  console.log(`[HTTP GET] ${SPRING_BOOT_BASE_URL}/destinations/filter - Params:`, filters);

  if (!USE_MOCK_SERVER) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${SPRING_BOOT_BASE_URL}/destinations/filter?${queryParams}`);
    return await response.json();
  }

  await simulateNetworkDelay(160);
  const allDest = window.DESTINATIONS_DATA || [];

  let result = allDest.filter(dest => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const match = dest.name.toLowerCase().includes(q) ||
                    dest.location.toLowerCase().includes(q) ||
                    dest.category.toLowerCase().includes(q) ||
                    (dest.tags && dest.tags.some(t => t.toLowerCase().includes(q)));
      if (!match) return false;
    }
    if (filters.category && filters.category !== "all") {
      if (dest.category.toLowerCase() !== filters.category.toLowerCase()) return false;
    }
    if (filters.region && filters.region !== "all") {
      if (!dest.region.toLowerCase().includes(filters.region.toLowerCase())) return false;
    }
    if (filters.maxBudget && dest.budget > Number(filters.maxBudget)) {
      return false;
    }
    if (filters.duration && filters.duration !== "all") {
      const dur = Number(filters.duration);
      if (dur === 3 ? dest.duration < 3 : dest.duration !== dur) return false;
    }
    return true;
  });

  return createServerResponse(200, `Filtered ${result.length} destinations matching criteria`, result);
}

/**
 * ==========================================================================
 * 3. TRIP PLANNER RECOMMENDATION API (TripPlannerController)
 * ==========================================================================
 */

/**
 * Generate personalized trip recommendations
 * Simulated Spring Endpoint: POST /api/trip-planner/recommend
 */
async function generateTripPlanAPI(planCriteria) {
  console.log(`[HTTP POST] ${SPRING_BOOT_BASE_URL}/trip-planner/recommend - Body:`, planCriteria);

  if (!USE_MOCK_SERVER) {
    const response = await fetch(`${SPRING_BOOT_BASE_URL}/trip-planner/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planCriteria)
    });
    return await response.json();
  }

  await simulateNetworkDelay(350);

  const allDest = window.DESTINATIONS_DATA || [];
  const perPersonBudget = planCriteria.budget / planCriteria.travelers;

  // Recommendation Scoring on simulated backend
  const scored = allDest.map(dest => {
    let score = 0;
    if (planCriteria.interests && Array.isArray(planCriteria.interests)) {
      planCriteria.interests.forEach(interest => {
        if (dest.tags && dest.tags.includes(interest)) score += 35;
        if (dest.category.toLowerCase().includes(interest.toLowerCase())) score += 20;
      });
    }
    if (dest.budget <= perPersonBudget) score += 25;
    else if (dest.budget <= perPersonBudget * 1.3) score += 10;

    const durDiff = Math.abs(dest.duration - planCriteria.days);
    if (durDiff === 0) score += 20;
    else if (durDiff === 1) score += 10;

    return { ...dest, matchScore: score };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  const recommendations = scored.slice(0, 3);

  const totalBudget = planCriteria.budget;
  const budgetBreakdown = {
    transport: Math.round(totalBudget * 0.28),
    stay: Math.round(totalBudget * 0.38),
    food: Math.round(totalBudget * 0.22),
    activities: Math.round(totalBudget * 0.12)
  };

  const responseData = {
    planCriteria: planCriteria,
    recommendations: recommendations,
    budgetBreakdown: budgetBreakdown,
    generatedAt: new Date().toISOString()
  };

  return createServerResponse(200, "Trip recommendations generated successfully", responseData);
}

/**
 * ==========================================================================
 * 4. TRAVEL AGENTS & INQUIRIES API (AgentController)
 * ==========================================================================
 */

/**
 * Fetch verified travel agents
 * Simulated Spring Endpoint: GET /api/travel-agents
 */
async function getTravelAgentsAPI() {
  console.log(`[HTTP GET] ${SPRING_BOOT_BASE_URL}/travel-agents`);

  if (!USE_MOCK_SERVER) {
    const response = await fetch(`${SPRING_BOOT_BASE_URL}/travel-agents`);
    return await response.json();
  }

  await simulateNetworkDelay(180);
  const agents = window.TRAVEL_AGENTS_DATA || [];
  return createServerResponse(200, `Retrieved ${agents.length} verified travel agents`, agents);
}

/**
 * Submit inquiry to a travel agent
 * Simulated Spring Endpoint: POST /api/travel-agents/inquiry
 */
async function submitAgentInquiryAPI(inquiryData) {
  console.log(`[HTTP POST] ${SPRING_BOOT_BASE_URL}/travel-agents/inquiry - Body:`, inquiryData);

  if (!USE_MOCK_SERVER) {
    const response = await fetch(`${SPRING_BOOT_BASE_URL}/travel-agents/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inquiryData)
    });
    return await response.json();
  }

  await simulateNetworkDelay(250);

  const newInquiry = {
    inquiryId: "INQ-" + Math.floor(100000 + Math.random() * 900000),
    ...inquiryData,
    status: "PENDING_AGENT_CALLBACK",
    receivedAt: new Date().toISOString()
  };

  SIMULATED_INQUIRIES.push(newInquiry);

  // If user is logged in, attach inquiry to their profile as well
  const activeUserId = localStorage.getItem("active_user_id");
  if (activeUserId) {
    const users = getSimulatedUsersDB();
    const user = users.find(u => String(u.id) === String(activeUserId));
    if (user) {
      if (!user.inquiries) user.inquiries = [];
      user.inquiries.unshift({
        id: newInquiry.inquiryId,
        agentName: inquiryData.agentName || "Partner Travel Agent",
        package: inquiryData.message || "Custom Trip Inquiry",
        status: "Pending Callback",
        date: new Date().toISOString().split("T")[0]
      });
      saveSimulatedUsersDB(users);
      localStorage.setItem("active_user", JSON.stringify(user));
    }
  }

  console.log("[Simulated Server] New inquiry persisted:", newInquiry);
  return createServerResponse(201, `Your inquiry has been successfully dispatched to ${inquiryData.agentName || 'the travel agent'}. Reference: ${newInquiry.inquiryId}`, newInquiry);
}

// Expose API module globally for all pages
window.ExplorerAPI = {
  getDestinations,
  getDestinationById,
  filterDestinationsAPI,
  generateTripPlanAPI,
  getTravelAgentsAPI,
  submitAgentInquiryAPI,
  loginUserAPI,
  registerUserAPI,
  getCurrentUserAPI,
  saveUserItineraryAPI,
  deleteUserItineraryAPI,
  logoutUserAPI,
  DEMO_USERS: INITIAL_DEMO_USERS
};
