/**
 * ==========================================================================
 * Maharashtra Explorer - Main Application Script & Shared Utilities
 * ==========================================================================
 */

// Mock Data for Verified Maharashtra Tourism Partner Travel Agents
const TRAVEL_AGENTS_DATA = [
  {
    id: 1,
    name: "Sahyadri Heritage Treks & Tours",
    location: "Pune, Maharashtra",
    specialization: "Fort Trekking, Historical Expeditions & Sahyadri Camping",
    rating: 4.9,
    reviewsCount: 142,
    phone: "+91 98231 45678",
    email: "contact@sahyadritreks.example.com",
    packages: [
      { title: "Raigad & Shivneri Forts Weekend Expedition", duration: "2 Days / 1 Night", price: "₹3,499 / person" },
      { title: "Sinhagad Sunrise Trek & Village Culinary Tour", duration: "1 Day", price: "₹1,299 / person" },
      { title: "Kalsubai Peak & Sandhan Valley Canyon Trek", duration: "2 Days / 1 Night", price: "₹2,899 / person" }
    ]
  },
  {
    id: 2,
    name: "Konkan Coastal Escapes",
    location: "Alibaug & Mumbai, Maharashtra",
    specialization: "Scuba Diving, Beach Resorts, Sea Forts & Water Sports",
    rating: 4.8,
    reviewsCount: 198,
    phone: "+91 98220 87654",
    email: "info@konkanescapes.example.com",
    packages: [
      { title: "Tarkarli Scuba Diving & Dolphin Safari Luxury Package", duration: "3 Days / 2 Nights", price: "₹8,999 / person" },
      { title: "Alibaug Weekend Beach Villa & Kolaba Fort Tour", duration: "2 Days / 1 Night", price: "₹4,799 / person" },
      { title: "Ganpatipule & Ratnagiri Coastal Marine Drive", duration: "3 Days / 2 Nights", price: "₹6,499 / person" }
    ]
  },
  {
    id: 3,
    name: "Marathwada Heritage & Caves Tourism",
    location: "Chhatrapati Sambhajinagar (Aurangabad), Maharashtra",
    specialization: "UNESCO World Heritage Tours (Ajanta & Ellora) & Forts",
    rating: 4.9,
    reviewsCount: 230,
    phone: "+91 94222 11223",
    email: "explore@ajantaelloratours.example.com",
    packages: [
      { title: "Ajanta & Ellora Caves Guided Archaeological Circuit", duration: "2 Days / 1 Night", price: "₹5,200 / person" },
      { title: "Golden Heritage: Daulatabad, Grishneshwar & Caves", duration: "3 Days / 2 Nights", price: "₹7,800 / person" },
      { title: "Paithan Silk Weaving & Heritage Monument Tour", duration: "1 Day", price: "₹2,100 / person" }
    ]
  },
  {
    id: 4,
    name: "Vidarbha Tiger Safari & Eco-Expeditions",
    location: "Nagpur & Chandrapur, Maharashtra",
    specialization: "Wildlife Photography Safaris, Tiger Tracking & Eco-Lodges",
    rating: 4.9,
    reviewsCount: 167,
    phone: "+91 97654 32109",
    email: "safari@vidarbhawildlife.example.com",
    packages: [
      { title: "Tadoba-Andhari 4-Jeep Core Safari Experience", duration: "3 Days / 2 Nights", price: "₹12,499 / person" },
      { title: "Pench & Umred Karhandla Tiger Corridor Tour", duration: "3 Days / 2 Nights", price: "₹11,200 / person" },
      { title: "Nagpur Orange Orchards & Wildlife Weekend", duration: "2 Days / 1 Night", price: "₹4,500 / person" }
    ]
  },
  {
    id: 5,
    name: "Sahyadri Bliss Hill Station Planners",
    location: "Mahabaleshwar & Satara, Maharashtra",
    specialization: "Hill Stations, Romantic Getaways & Waterfall Trails",
    rating: 4.7,
    reviewsCount: 115,
    phone: "+91 98500 66778",
    email: "holidays@sahyadribliss.example.com",
    packages: [
      { title: "Mahabaleshwar & Panchgani Strawberry Holiday", duration: "3 Days / 2 Nights", price: "₹7,500 / person" },
      { title: "Thoseghar Waterfalls & Kaas Valley of Flowers Tour", duration: "2 Days / 1 Night", price: "₹3,800 / person" },
      { title: "Lonavala & Khandala Monsoon Misty Retreat", duration: "2 Days / 1 Night", price: "₹4,200 / person" }
    ]
  },
  {
    id: 6,
    name: "Pavitra Maharashtra Spiritual Yatra",
    location: "Nashik & Shirdi, Maharashtra",
    specialization: "Jyotirlinga Darshan, Shirdi Pilgrimage & Temple Circuits",
    rating: 4.8,
    reviewsCount: 289,
    phone: "+91 94230 99887",
    email: "yatra@pavitramaharashtra.example.com",
    packages: [
      { title: "Nashik Trimbakeshwar & Panchavati Divine Darshan", duration: "2 Days / 1 Night", price: "₹3,900 / person" },
      { title: "Shirdi Sai Baba & Shani Shingnapur Spiritual Tour", duration: "2 Days / 1 Night", price: "₹4,100 / person" },
      { title: "Ashtavinayak Ganpati 8-Temple Complete Parikrama", duration: "3 Days / 2 Nights", price: "₹6,800 / person" }
    ]
  }
];

window.TRAVEL_AGENTS_DATA = TRAVEL_AGENTS_DATA;

// Global Initialization
document.addEventListener("DOMContentLoaded", () => {
  highlightActiveNavLink();
  initContactModals();
  initNewsletterForm();
  updateNavbarSessionState();
  initHomePageUserProfile();
});

/**
 * Automatically highlight the active navigation link based on current path
 */
function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/**
 * Show a non-blocking modern Toast notification
 */
function showAppToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("app-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "app-toast-container";
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.style.zIndex = "1095";
    document.body.appendChild(container);
  }

  const toastId = "toast-" + Date.now();
  const iconClass = type === "success" 
    ? "fa-solid fa-circle-check text-success" 
    : type === "danger" 
    ? "fa-solid fa-triangle-exclamation text-danger" 
    : "fa-solid fa-circle-info text-primary";

  const toastEl = document.createElement("div");
  toastEl.id = toastId;
  toastEl.className = "toast align-items-center show shadow-lg border-0 mb-2";
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");
  toastEl.style.backgroundColor = "#ffffff";
  toastEl.style.minWidth = "280px";
  toastEl.style.borderRadius = "10px";
  toastEl.style.borderLeft = type === "success" ? "4px solid #198754" : type === "danger" ? "4px solid #dc3545" : "4px solid #0d6efd";

  toastEl.innerHTML = `
    <div class="d-flex p-3 align-items-center">
      <div class="fs-5 me-3">
        <i class="${iconClass}"></i>
      </div>
      <div class="toast-body p-0 flex-grow-1 text-dark small fw-medium">
        ${message}
      </div>
      <button type="button" class="btn-close ms-2 me-0 btn-close-sm" aria-label="Close" onclick="document.getElementById('${toastId}').remove()"></button>
    </div>
  `;

  container.appendChild(toastEl);

  setTimeout(() => {
    if (toastEl && toastEl.parentElement) {
      toastEl.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      toastEl.style.opacity = "0";
      toastEl.style.transform = "translateY(10px)";
      setTimeout(() => toastEl.remove(), 400);
    }
  }, duration);
}

/**
 * Update Navigation bar session UI based on current login status
 */
async function updateNavbarSessionState() {
  const navLoginBtn = document.getElementById("nav-login-btn");
  const dropdownWrap = document.getElementById("nav-user-dropdown-wrap");
  
  // Find current container element (either button or wrapper)
  const targetElement = navLoginBtn || dropdownWrap;
  if (!targetElement) return;

  if (window.ExplorerAPI && window.ExplorerAPI.getCurrentUserAPI) {
    const res = await window.ExplorerAPI.getCurrentUserAPI();
    if (res.success && res.data) {
      const user = res.data;
      const firstName = user.fullName ? user.fullName.split(" ")[0] : "Member";
      const isHome = window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/");

      const parentContainer = targetElement.parentElement;
      if (parentContainer) {
        let wrap = document.getElementById("nav-user-dropdown-wrap");
        if (!wrap) {
          wrap = document.createElement("div");
          wrap.id = "nav-user-dropdown-wrap";
          wrap.className = "dropdown d-inline-block";
          parentContainer.replaceChild(wrap, targetElement);
        }

        wrap.innerHTML = `
          <button class="btn btn-outline-primary d-flex align-items-center gap-2 dropdown-toggle px-3" type="button" id="navUserDropdownMenu" data-bs-toggle="dropdown" aria-expanded="false">
            <span class="badge bg-success rounded-circle p-1"></span>
            <span><i class="fa-solid fa-user-circle me-1"></i> ${firstName}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2" id="nav-user-dropdown-menu-list" aria-labelledby="navUserDropdownMenu" style="min-width: 230px; border-radius: 10px; z-index: 1060;">
            <li class="px-3 py-2 border-bottom bg-light rounded-top">
              <div class="fw-bold text-dark text-truncate small">${user.fullName}</div>
              <div class="text-muted text-truncate" style="font-size: 0.75rem;">${user.email}</div>
            </li>
            <li>
              <a class="dropdown-item py-2 small d-flex align-items-center gap-2" href="${isHome ? '#user-profile-section' : 'index.html#user-profile-section'}">
                <i class="fa-solid fa-id-badge text-primary"></i> My Profile & Trips
              </a>
            </li>
            <li>
              <a class="dropdown-item py-2 small d-flex align-items-center gap-2" href="plan-trip.html">
                <i class="fa-solid fa-wand-magic-sparkles text-warning"></i> AI Trip Planner
              </a>
            </li>
            <li><hr class="dropdown-divider my-1"></li>
            <li>
              <button type="button" class="dropdown-item text-danger py-2 small d-flex align-items-center gap-2 w-100 text-start bg-transparent border-0 btn-signout" id="nav-signout-btn" data-action="signout" onclick="handleUserLogout(event)">
                <i class="fa-solid fa-arrow-right-from-bracket"></i> <strong>Sign Out</strong>
              </button>
            </li>
          </ul>
        `;

        // Direct fallback click binding for dropdown toggle to guarantee interaction in all environments
        const toggleBtn = wrap.querySelector("#navUserDropdownMenu");
        const menuList = wrap.querySelector("#nav-user-dropdown-menu-list");
        if (toggleBtn && menuList) {
          toggleBtn.onclick = (e) => {
            e.stopPropagation();
            menuList.classList.toggle("show");
            toggleBtn.setAttribute("aria-expanded", menuList.classList.contains("show"));
          };
        }
      }
    } else {
      // User is not logged in: Restore original login button if dropdown existed
      const currentWrap = document.getElementById("nav-user-dropdown-wrap");
      if (currentWrap && currentWrap.parentElement) {
        const loginBtn = document.createElement("a");
        loginBtn.href = "login.html";
        loginBtn.className = "btn navbar-btn-outline";
        loginBtn.id = "nav-login-btn";
        loginBtn.innerHTML = `<i class="fa-regular fa-user me-1"></i> Login`;
        currentWrap.parentElement.replaceChild(loginBtn, currentWrap);
      } else if (navLoginBtn) {
        navLoginBtn.className = "btn navbar-btn-outline";
        navLoginBtn.innerHTML = `<i class="fa-regular fa-user me-1"></i> Login`;
        navLoginBtn.href = "login.html";
        navLoginBtn.onclick = null;
      }
    }
  }
}

/**
 * Initialize User Profile on Home Page
 */
async function initHomePageUserProfile() {
  const profileSection = document.getElementById("user-profile-section");
  const demoBanner = document.getElementById("demo-user-banner");
  const profileContainer = document.getElementById("user-profile-card-container");

  if (!profileSection || !profileContainer) return;

  if (window.ExplorerAPI && window.ExplorerAPI.getCurrentUserAPI) {
    const response = await window.ExplorerAPI.getCurrentUserAPI();

    if (response.success && response.data) {
      const user = response.data;
      
      // Show profile section, hide guest demo banner
      profileSection.classList.remove("d-none");
      if (demoBanner) demoBanner.classList.add("d-none");

      renderUserProfileCard(user, profileContainer);
    } else {
      // User is not logged in
      profileSection.classList.add("d-none");
      if (demoBanner) demoBanner.classList.remove("d-none");
    }
  }
}

/**
 * Render User Profile Dashboard Card on Home Page
 */
function renderUserProfileCard(user, container) {
  const savedItineraries = user.savedItineraries || [];
  const userInterests = user.interests || ["Forts", "Trekking", "Heritage"];
  const userInquiries = user.inquiries || [];

  const avatarHTML = user.avatar 
    ? `<img src="${user.avatar}" alt="${user.fullName}" class="profile-avatar-circle" onerror="this.outerHTML='<div class=\\'profile-avatar-fallback\\'>${user.fullName.charAt(0)}</div>'" />`
    : `<div class="profile-avatar-fallback">${user.fullName.charAt(0)}</div>`;

  container.innerHTML = `
    <div class="user-profile-banner">
      <!-- Profile Header Strip -->
      <div class="profile-header-strip">
        <div class="row align-items-center g-3">
          <div class="col-auto">
            ${avatarHTML}
          </div>
          <div class="col">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
              <h2 class="h4 fw-bold text-white mb-0">${user.fullName}</h2>
              <span class="badge bg-warning text-dark fw-bold px-2 py-1">
                <i class="fa-solid fa-award me-1"></i> ${user.tier || 'Sahyadri Voyager'}
              </span>
              <span class="badge bg-success text-white px-2 py-1">
                <i class="fa-solid fa-check-double me-1"></i> Spring Security Authenticated
              </span>
            </div>
            <div class="text-light opacity-90 small d-flex flex-wrap gap-3">
              <span><i class="fa-regular fa-envelope me-1"></i> ${user.email}</span>
              <span><i class="fa-solid fa-phone me-1"></i> ${user.phone || '+91 98220 12345'}</span>
              <span><i class="fa-solid fa-location-dot me-1"></i> ${user.homeCity || 'Pune, Maharashtra'}</span>
            </div>
          </div>
          <div class="col-12 col-md-auto d-flex gap-2">
            <a href="plan-trip.html" class="btn btn-warning text-dark fw-bold btn-sm px-3">
              <i class="fa-solid fa-wand-magic-sparkles me-1"></i> Plan Trip
            </a>
            <button type="button" class="btn btn-outline-light btn-sm px-3 btn-signout" data-action="signout" onclick="handleUserLogout(event)">
              <i class="fa-solid fa-arrow-right-from-bracket me-1"></i> Sign Out
            </button>
          </div>
        </div>
      </div>

      <!-- Profile Body Stats & Content -->
      <div class="p-4">
        <div class="row g-3 mb-4">
          <!-- Stat 1: Saved Itineraries -->
          <div class="col-6 col-md-3">
            <div class="profile-stat-box">
              <div class="d-flex align-items-center justify-content-between">
                <div class="small text-muted fw-bold">Saved Itineraries</div>
                <i class="fa-solid fa-map-location-dot text-primary fs-5"></i>
              </div>
              <div class="h3 fw-bold text-dark mt-2 mb-0">${savedItineraries.length}</div>
              <div class="small text-success mt-1"><i class="fa-solid fa-cloud-arrow-up me-1"></i> Synced to DB</div>
            </div>
          </div>

          <!-- Stat 2: Active Inquiries -->
          <div class="col-6 col-md-3">
            <div class="profile-stat-box">
              <div class="d-flex align-items-center justify-content-between">
                <div class="small text-muted fw-bold">Agent Inquiries</div>
                <i class="fa-solid fa-comments text-success fs-5"></i>
              </div>
              <div class="h3 fw-bold text-dark mt-2 mb-0">${userInquiries.length}</div>
              <div class="small text-muted mt-1">Verified Operator Connect</div>
            </div>
          </div>

          <!-- Stat 3: Travel Preferences -->
          <div class="col-12 col-md-6">
            <div class="profile-stat-box h-100">
              <div class="small text-muted fw-bold mb-2">
                <i class="fa-solid fa-heart text-danger me-1"></i> Preferred Travel Interests:
              </div>
              <div class="d-flex flex-wrap gap-1">
                ${userInterests.map(interest => `<span class="interest-tag-pill">${interest}</span>`).join("")}
              </div>
            </div>
          </div>
        </div>

        <!-- Saved Itineraries Header & List -->
        <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <div>
            <h3 class="h5 fw-bold text-dark mb-0">
              <i class="fa-solid fa-bookmark text-primary me-2"></i> Your Saved Travel Itineraries
            </h3>
            <p class="text-muted small mb-0">Manage your personalized travel plans and bookings.</p>
          </div>
          <a href="plan-trip.html" class="btn btn-sm btn-outline-primary">
            <i class="fa-solid fa-plus me-1"></i> New Itinerary
          </a>
        </div>

        <!-- Itineraries Grid -->
        <div class="row g-3" id="saved-itineraries-list">
          ${savedItineraries.length > 0 ? savedItineraries.map(itn => `
            <div class="col-md-6" id="itn-card-${itn.id}">
              <div class="saved-itinerary-card">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                    <i class="fa-solid fa-route me-1"></i> ${itn.id}
                  </span>
                  <span class="text-muted small"><i class="fa-regular fa-calendar me-1"></i>${itn.createdDate || 'Recent'}</span>
                </div>
                <h4 class="h6 fw-bold text-dark mb-1">${itn.title}</h4>
                <div class="text-muted small mb-2">
                  <i class="fa-solid fa-location-dot text-danger me-1"></i><strong>${itn.destination}</strong> • ${itn.days} Days • ${itn.travelers || 2} Travelers
                </div>
                <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                  <span class="fw-bold text-primary">₹${(itn.budget || 0).toLocaleString()} <small class="text-muted fw-normal">budget</small></span>
                  <div class="btn-group btn-group-sm">
                    <a href="plan-trip.html?destination=1" class="btn btn-outline-secondary btn-sm" title="View & customize in planner">
                      <i class="fa-solid fa-arrow-up-right-from-square"></i> Open
                    </a>
                    <button class="btn btn-outline-danger btn-sm" onclick="handleDeleteItinerary('${itn.id}')" title="Delete itinerary">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join("") : `
            <div class="col-12">
              <div class="text-center py-4 bg-light rounded border">
                <i class="fa-solid fa-map-location text-muted fs-2 mb-2"></i>
                <p class="text-muted small mb-2">You haven't saved any itineraries yet.</p>
                <a href="plan-trip.html" class="btn btn-sm btn-primary-custom">Generate Your First Itinerary</a>
              </div>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}

/**
 * 1-Click Quick Demo Login Helper for Testing
 */
async function loginDemoUserQuick() {
  if (window.ExplorerAPI && window.ExplorerAPI.loginUserAPI) {
    const res = await window.ExplorerAPI.loginUserAPI({
      email: "demo.traveler@example.com",
      password: "Password123"
    });

    if (res.success && res.data) {
      showAppToast(`Welcome back, ${res.data.user.fullName}!`, "success");
      await updateNavbarSessionState();
      await initHomePageUserProfile();
      
      const profSec = document.getElementById("user-profile-section");
      if (profSec) profSec.scrollIntoView({ behavior: "smooth" });
    }
  }
}

/**
 * Handle Deleting a Saved Itinerary via Simulated API
 */
async function handleDeleteItinerary(itineraryId) {
  if (window.ExplorerAPI && window.ExplorerAPI.deleteUserItineraryAPI) {
    const res = await window.ExplorerAPI.deleteUserItineraryAPI(itineraryId);
    if (res.success) {
      const card = document.getElementById(`itn-card-${itineraryId}`);
      if (card) {
        card.style.transition = "all 0.3s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.95)";
        setTimeout(() => {
          card.remove();
          initHomePageUserProfile();
        }, 300);
      }
      showAppToast(`Itinerary ${itineraryId} removed from your profile.`, "info");
    }
  }
}

/**
 * Handle User Logout cleanly across all views without blocking prompts
 */
async function handleUserLogout(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();

  console.log("[Auth] Signing out user session...");

  // 1. Clear local storage session tokens immediately
  localStorage.removeItem("auth_token");
  localStorage.removeItem("active_user_id");
  localStorage.removeItem("active_user");

  // 2. Call simulated/real backend logout API
  if (window.ExplorerAPI && window.ExplorerAPI.logoutUserAPI) {
    try {
      await window.ExplorerAPI.logoutUserAPI();
    } catch (err) {
      console.warn("Logout API error:", err);
    }
  }

  // 3. Display user feedback toast
  showAppToast("You have been signed out successfully.", "info");

  // 4. Update the navbar back to guest/login state immediately
  await updateNavbarSessionState();

  // 5. Update user profile container if on the home page
  const profileSection = document.getElementById("user-profile-section");
  const demoBanner = document.getElementById("demo-user-banner");
  if (profileSection) {
    profileSection.classList.add("d-none");
  }
  if (demoBanner) {
    demoBanner.classList.remove("d-none");
  }

  // 6. Dispatch custom event for any listeners
  window.dispatchEvent(new CustomEvent("explorer-auth-changed", { detail: { loggedIn: false } }));
}

// Global click event delegation for signout triggers
document.addEventListener("click", (evt) => {
  const signoutBtn = evt.target.closest("#nav-signout-btn, .btn-signout, [data-action='signout']");
  if (signoutBtn) {
    evt.preventDefault();
    evt.stopPropagation();
    handleUserLogout(evt);
  }
});

// Expose methods to global window scope for inline HTML handlers
window.handleUserLogout = handleUserLogout;
window.loginDemoUserQuick = loginDemoUserQuick;
window.handleDeleteItinerary = handleDeleteItinerary;
window.showAppToast = showAppToast;
window.updateNavbarSessionState = updateNavbarSessionState;
window.initHomePageUserProfile = initHomePageUserProfile;

/**
 * Initialize Travel Agent Inquiry Modal and Handlers
 */
function initContactModals() {
  const inquiryForms = document.querySelectorAll(".agent-inquiry-form");
  inquiryForms.forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nameInput = form.querySelector('input[placeholder*="Rahul"], input[name="fullName"]');
      const phoneInput = form.querySelector('input[type="tel"]');
      const emailInput = form.querySelector('input[type="email"]');
      const msgInput = form.querySelector('textarea');
      const agentNameInput = document.getElementById("modal-agent-name");

      const inquiryData = {
        agentName: agentNameInput ? agentNameInput.value : "Partner Travel Agent",
        customerName: nameInput ? nameInput.value : "Guest Traveler",
        customerPhone: phoneInput ? phoneInput.value : "",
        customerEmail: emailInput ? emailInput.value : "",
        message: msgInput ? msgInput.value : ""
      };

      if (window.ExplorerAPI && window.ExplorerAPI.submitAgentInquiryAPI) {
        const res = await window.ExplorerAPI.submitAgentInquiryAPI(inquiryData);
        showAppToast(res.message, "success");
      } else {
        showAppToast("Your travel inquiry has been received! Our agent will contact you shortly.", "success");
      }

      const modalEl = form.closest(".modal");
      if (modalEl && window.bootstrap) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      }
      form.reset();
      initHomePageUserProfile();
    });
  });
}

/**
 * Handle Newsletter Subscription Form
 */
function initNewsletterForm() {
  const newsForm = document.getElementById("newsletter-form");
  if (newsForm) {
    newsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("newsletter-email");
      if (emailInput && emailInput.value) {
        showAppToast(`Thank you for subscribing! Travel updates will be sent to ${emailInput.value}.`, "success");
        emailInput.value = "";
      }
    });
  }
}

/**
 * Helper to open Agent Contact Modal with preselected agent name
 */
function openAgentContactModal(agentName, agentPhone) {
  const modalAgentNameInput = document.getElementById("modal-agent-name");
  const modalAgentInfo = document.getElementById("modal-agent-info");

  if (modalAgentNameInput) modalAgentNameInput.value = agentName;
  if (modalAgentInfo) modalAgentInfo.textContent = `Inquiring with: ${agentName} (${agentPhone})`;

  const modalElement = document.getElementById("agentContactModal");
  if (modalElement && window.bootstrap) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  } else {
    const userMsg = prompt(`Enter your phone number to request a callback from ${agentName}:`);
    if (userMsg) {
      alert(`Thank you! ${agentName} has received your request and will call you soon.`);
    }
  }
}

/**
 * Helper to show package details modal
 */
function openAgentPackagesModal(agentId) {
  const agent = TRAVEL_AGENTS_DATA.find(a => a.id === agentId);
  if (!agent) return;

  const pkgTitleEl = document.getElementById("packagesModalTitle");
  const pkgBodyEl = document.getElementById("packagesModalBody");

  if (pkgTitleEl) pkgTitleEl.textContent = `Packages by ${agent.name}`;
  if (pkgBodyEl) {
    pkgBodyEl.innerHTML = `
      <div class="mb-3">
        <span class="badge bg-success me-2"><i class="fa-solid fa-star"></i> ${agent.rating} (${agent.reviewsCount} reviews)</span>
        <span class="text-muted"><i class="fa-solid fa-location-dot text-danger me-1"></i>${agent.location}</span>
      </div>
      <p class="small text-secondary mb-3"><strong>Specialization:</strong> ${agent.specialization}</p>
      <h6 class="fw-bold mb-2">Available Tour Packages:</h6>
      <div class="list-group mb-3">
        ${agent.packages.map((pkg, idx) => `
          <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-bold text-dark">${pkg.title}</div>
              <small class="text-muted"><i class="fa-regular fa-clock me-1"></i>${pkg.duration}</small>
            </div>
            <span class="badge bg-primary fs-6">${pkg.price}</span>
          </div>
        `).join("")}
      </div>
      <div class="alert alert-light border small text-muted">
        <i class="fa-solid fa-circle-info text-primary me-1"></i> Travel agent information simulated via <code>js/api.js</code>.
      </div>
    `;
  }

  const modalEl = document.getElementById("agentPackagesModal");
  if (modalEl && window.bootstrap) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

/**
 * ==========================================================================
 * Multi-Lingual Support for HTML Pages (English, Marathi, Hindi)
 * ==========================================================================
 */
const SITE_LANG_STORAGE_KEY = "maharashtra_explorer_lang";

const STATIC_PAGE_TRANSLATIONS = {
  en: {
    brandName: "Maharashtra Explorer",
    navHome: "Home",
    navDestinations: "Destinations",
    navPlanTrip: "Plan My Trip",
    navAgents: "Travel Agents",
    navLogin: "Login",
    navAiPlanner: "AI Planner",
    langName: "English"
  },
  mr: {
    brandName: "महाराष्ट्र एक्सप्लोरर",
    navHome: "मुखपृष्ठ",
    navDestinations: "पर्यटन स्थळे",
    navPlanTrip: "माझी सहल आखा",
    navAgents: "पर्यटन मार्गदर्शक",
    navLogin: "साइन इन",
    navAiPlanner: "एआय प्लॅनर",
    langName: "मराठी"
  },
  hi: {
    brandName: "महाराष्ट्र एक्सप्लोरर",
    navHome: "मुख्य पृष्ठ",
    navDestinations: "पर्यटन स्थल",
    navPlanTrip: "यात्रा योजना बनाएं",
    navAgents: "ट्रैवल एजेंट्स",
    navLogin: "साइन इन",
    navAiPlanner: "एआई प्लानर",
    langName: "हिन्दी"
  }
};

function getActiveLanguage() {
  try {
    const saved = localStorage.getItem(SITE_LANG_STORAGE_KEY);
    if (saved === "mr" || saved === "hi" || saved === "en") {
      return saved;
    }
  } catch (e) {}
  return "en";
}

function setSiteLanguage(lang) {
  if (lang !== "en" && lang !== "mr" && lang !== "hi") return;
  try {
    localStorage.setItem(SITE_LANG_STORAGE_KEY, lang);
  } catch (e) {}
  applySiteLanguage(lang);
}

function applySiteLanguage(lang) {
  const dict = STATIC_PAGE_TRANSLATIONS[lang] || STATIC_PAGE_TRANSLATIONS.en;
  document.documentElement.lang = lang;

  const currentLangDisplay = document.getElementById("currentLangDisplay");
  if (currentLangDisplay) {
    currentLangDisplay.textContent = dict.langName;
  }

  const brandEl = document.querySelector("#nav-brand-logo span:last-child");
  if (brandEl) {
    brandEl.textContent = dict.brandName;
  }

  const navHome = document.getElementById("nav-home");
  if (navHome) navHome.textContent = dict.navHome;

  const navDest = document.getElementById("nav-destinations");
  if (navDest) navDest.textContent = dict.navDestinations;

  const navPlan = document.getElementById("nav-plan-trip");
  if (navPlan) navPlan.textContent = dict.navPlanTrip;

  const navAgents = document.getElementById("nav-agents");
  if (navAgents) navAgents.textContent = dict.navAgents;

  const navLogin = document.getElementById("nav-login-btn");
  if (navLogin) {
    navLogin.innerHTML = `<i class="fa-regular fa-user me-1"></i> ${dict.navLogin}`;
  }

  const navCta = document.getElementById("nav-cta-btn");
  if (navCta) {
    navCta.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles me-1"></i> ${dict.navAiPlanner}`;
  }
}

// Auto-initialize language on page load
document.addEventListener("DOMContentLoaded", function () {
  const lang = getActiveLanguage();
  applySiteLanguage(lang);
});

