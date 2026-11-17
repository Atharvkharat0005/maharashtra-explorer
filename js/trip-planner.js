/**
 * ==========================================================================
 * Maharashtra Explorer - Intelligent Trip Planner & Recommendation Engine
 * ==========================================================================
 * 
 * Connected to simulated Spring Boot Server REST APIs via `js/api.js`.
 */

let CURRENT_GENERATED_PLAN = null;

document.addEventListener("DOMContentLoaded", () => {
  const tripForm = document.getElementById("trip-planner-form");
  const budgetInput = document.getElementById("planner-budget");
  const budgetDisplay = document.getElementById("budget-display");

  // Live update budget slider display
  if (budgetInput && budgetDisplay) {
    budgetInput.addEventListener("input", (e) => {
      const val = Number(e.target.value);
      budgetDisplay.textContent = `₹${val.toLocaleString()}`;
    });
  }

  // Pre-fill destination interest if URL contains destination param
  const urlParams = new URLSearchParams(window.location.search);
  const targetDestId = urlParams.get("destination");
  if (targetDestId && window.DESTINATIONS_DATA) {
    const dest = window.DESTINATIONS_DATA.find(d => d.id === Number(targetDestId));
    if (dest) {
      const noticeBox = document.getElementById("prefilled-notice");
      if (noticeBox) {
        noticeBox.innerHTML = `
          <div class="alert alert-info d-flex align-items-center mb-4" role="alert">
            <i class="fa-solid fa-compass me-2 fs-5"></i>
            <div>
              Customizing a personalized itinerary focused on <strong>${dest.name}</strong> (${dest.category}). 
              Adjust your duration and preferences below.
            </div>
          </div>
        `;
      }
    }
  }

  // Handle Form Submission
  if (tripForm) {
    tripForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleTripGeneration();
    });
  }
});

/**
 * Handle Trip Generation Form Submission using Simulated Server API
 */
async function handleTripGeneration() {
  const startLocation = document.getElementById("planner-start").value;
  const budget = Number(document.getElementById("planner-budget").value);
  const days = Number(document.getElementById("planner-days").value);
  const travelers = Number(document.getElementById("planner-travelers").value);
  const transport = document.getElementById("planner-transport").value;
  const stay = document.getElementById("planner-stay").value;

  // Gather checked interests
  const interestCheckboxes = document.querySelectorAll('input[name="interests"]:checked');
  const selectedInterests = Array.from(interestCheckboxes).map(cb => cb.value);

  if (selectedInterests.length === 0) {
    alert("Please select at least one interest to help our recommendation engine plan your trip.");
    return;
  }

  // Show loading indicator
  const resultsContainer = document.getElementById("trip-results-container");
  const loadingIndicator = document.getElementById("planner-loading");

  if (resultsContainer) resultsContainer.style.display = "none";
  if (loadingIndicator) {
    loadingIndicator.style.display = "block";
    loadingIndicator.scrollIntoView({ behavior: "smooth" });
  }

  const planCriteria = {
    startLocation,
    budget,
    days,
    travelers,
    transport,
    stay,
    interests: selectedInterests
  };

  try {
    // Call simulated Spring Boot REST API
    let recommendedResults = [];
    let budgetBreakdown = null;

    if (window.ExplorerAPI && window.ExplorerAPI.generateTripPlanAPI) {
      const serverRes = await window.ExplorerAPI.generateTripPlanAPI(planCriteria);
      if (serverRes.success && serverRes.data) {
        recommendedResults = serverRes.data.recommendations;
        budgetBreakdown = serverRes.data.budgetBreakdown;
      }
    }

    if (!recommendedResults || recommendedResults.length === 0) {
      recommendedResults = calculateRecommendations(planCriteria);
    }

    CURRENT_GENERATED_PLAN = {
      criteria: planCriteria,
      recommendations: recommendedResults,
      budgetBreakdown: budgetBreakdown
    };

    // Render results
    renderTripPlan(planCriteria, recommendedResults, budgetBreakdown);

  } catch (error) {
    console.error("Trip plan generation error:", error);
    const fallbackResults = calculateRecommendations(planCriteria);
    renderTripPlan(planCriteria, fallbackResults);
  } finally {
    if (loadingIndicator) loadingIndicator.style.display = "none";
    if (resultsContainer) {
      resultsContainer.style.display = "block";
      resultsContainer.scrollIntoView({ behavior: "smooth" });
    }
  }
}

/**
 * Fallback recommendation algorithm
 */
function calculateRecommendations(criteria) {
  const allDestinations = window.DESTINATIONS_DATA || [];
  const perPersonBudget = criteria.budget / criteria.travelers;

  const scoredDestinations = allDestinations.map(dest => {
    let score = 0;
    criteria.interests.forEach(interest => {
      if (dest.tags && dest.tags.includes(interest)) score += 35;
      if (dest.category.toLowerCase().includes(interest.toLowerCase())) score += 20;
    });

    if (dest.budget <= perPersonBudget) score += 25;
    else if (dest.budget <= perPersonBudget * 1.3) score += 10;

    const durDiff = Math.abs(dest.duration - criteria.days);
    if (durDiff === 0) score += 20;
    else if (durDiff === 1) score += 10;

    return { ...dest, matchScore: score };
  });

  scoredDestinations.sort((a, b) => b.matchScore - a.matchScore);
  return scoredDestinations.slice(0, 3);
}

/**
 * Render Generated Trip Plan and Itinerary
 */
function renderTripPlan(criteria, recommendations, serverBreakdown) {
  const primaryDest = recommendations[0] || window.DESTINATIONS_DATA[0];
  const totalBudget = criteria.budget;
  const travelers = criteria.travelers;
  const days = criteria.days;

  const transportEst = serverBreakdown ? serverBreakdown.transport : Math.round(totalBudget * 0.28);
  const stayEst = serverBreakdown ? serverBreakdown.stay : Math.round(totalBudget * 0.38);
  const foodEst = serverBreakdown ? serverBreakdown.food : Math.round(totalBudget * 0.22);
  const activitiesEst = serverBreakdown ? serverBreakdown.activities : Math.round(totalBudget * 0.12);

  // 1. Update Trip Summary Header
  const summaryHeader = document.getElementById("trip-summary-header");
  if (summaryHeader) {
    summaryHeader.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-light rounded-3 border mb-4">
        <div>
          <span class="badge bg-success mb-1"><i class="fa-solid fa-server me-1"></i> Spring Boot Plan Computed</span>
          <h3 class="h4 mb-0 text-dark">${primaryDest.name} & Surrounding Highlights</h3>
          <p class="text-muted small mb-0">From <strong>${criteria.startLocation}</strong> • ${days} Days / ${days - 1} Nights • ${travelers} Traveler${travelers > 1 ? 's' : ''}</p>
        </div>
        <div class="d-flex flex-column align-items-md-end gap-2">
          <div class="text-md-end">
            <div class="small text-muted">Estimated Total Budget</div>
            <div class="h3 mb-0 text-primary fw-bold">₹${totalBudget.toLocaleString()}</div>
            <div class="small text-secondary">~₹${Math.round(totalBudget / travelers).toLocaleString()} / person</div>
          </div>
          <button class="btn btn-sm btn-primary-custom" id="save-itinerary-btn" onclick="saveCurrentPlanToProfile()">
            <i class="fa-solid fa-bookmark me-1"></i> Save to Profile
          </button>
        </div>
      </div>
    `;
  }

  // 2. Render Recommended Destination Cards
  const recGrid = document.getElementById("recommended-destinations-grid");
  if (recGrid) {
    recGrid.innerHTML = recommendations.map(dest => `
      <div class="col-md-4 mb-3">
        <div class="card h-100 border shadow-sm">
          <img src="${dest.image}" class="card-img-top" alt="${dest.name}" style="height: 150px; object-fit: cover;" />
          <div class="card-body p-3">
            <span class="badge bg-dark mb-1">${dest.category}</span>
            <h5 class="card-title h6 mb-1">${dest.name}</h5>
            <p class="text-muted small mb-2"><i class="fa-solid fa-location-dot text-danger me-1"></i>${dest.location}</p>
            <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <span class="small fw-bold text-primary">₹${dest.budget.toLocaleString()} / person</span>
              <a href="destination-details.html?id=${dest.id}" class="btn btn-sm btn-outline-primary" target="_blank">View Info</a>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  }

  // 3. Generate Day-by-Day Itinerary
  const itineraryContainer = document.getElementById("itinerary-timeline");
  if (itineraryContainer) {
    let itineraryHTML = "";

    for (let day = 1; day <= days; day++) {
      let dayTitle = "";
      let dayActivities = [];
      let mealTip = "";

      if (day === 1) {
        dayTitle = `Day 1: Arrival & Local Sightseeing in ${primaryDest.name}`;
        dayActivities = [
          `Depart from ${criteria.startLocation} via ${criteria.transport}. Scenic highway drive with breakfast stop.`,
          `Check-in at your chosen ${criteria.stay} accommodation and freshen up.`,
          `Afternoon exploration of ${primaryDest.popularAttractions ? primaryDest.popularAttractions[0] : 'central landmarks and viewpoints'}.`,
          `Evening sunset stroll at local promenade or viewpoint with authentic local snacks.`
        ];
        mealTip = `Try traditional local lunch: Pithla Bhakri, fresh Misal Pav, or regional seafood specialties.`;
      } else if (day === days) {
        dayTitle = `Day ${day}: Heritage Discovery, Shopping & Return to ${criteria.startLocation}`;
        dayActivities = [
          `Early morning sunrise view and local temple / nature walk before crowds gather.`,
          `Visit local artisan markets for regional souvenirs, honey, chikki, or handloom crafts.`,
          `Final leisurely lunch at a highly rated heritage restaurant.`,
          `Pack up, check-out, and commence comfortable return journey to ${criteria.startLocation}.`
        ];
        mealTip = `Pick up fresh sweets and snacks for your return journey.`;
      } else if (day === 2) {
        dayTitle = `Day 2: Full Day Adventure & Core Attractions`;
        dayActivities = [
          `Morning excursion to ${primaryDest.popularAttractions ? primaryDest.popularAttractions[1] || primaryDest.popularAttractions[0] : 'prominent fort and scenic valley'}.`,
          `Guided heritage / eco-tour with photo opportunities and nature observation.`,
          `Visit nearby attractions: ${primaryDest.nearbyDestinations ? primaryDest.nearbyDestinations.join(", ") : 'local caves and waterfalls'}.`,
          `Traditional evening cultural dinner with folk music or campfire.`
        ];
        mealTip = `Recommended Dinner: Full Maharashtrian Thali or fresh barbecue at resort.`;
      } else {
        const secondaryDest = recommendations[1] || primaryDest;
        dayTitle = `Day ${day}: Exploring ${secondaryDest.name} & Nature Excursions`;
        dayActivities = [
          `Day excursion towards ${secondaryDest.name} (${secondaryDest.category}).`,
          `Engage in outdoor activities: ${criteria.interests.join(", ")}.`,
          `Photography and relaxation amidst scenic natural landscapes.`,
          `Evening leisure time and village craft exploration.`
        ];
        mealTip = `Taste authentic village-style home cooked delicacies.`;
      }

      itineraryHTML += `
        <div class="itinerary-day-card mb-3" id="itinerary-day-${day}">
          <span class="itinerary-day-badge">DAY ${day}</span>
          <h4 class="h5 mb-2">${dayTitle}</h4>
          <ul class="mb-2 ps-3 text-secondary small">
            ${dayActivities.map(act => `<li class="mb-1">${act}</li>`).join("")}
          </ul>
          <div class="p-2 bg-light rounded text-muted small">
            <i class="fa-solid fa-utensils text-warning me-1"></i> <strong>Dining Note:</strong> ${mealTip}
          </div>
        </div>
      `;
    }

    itineraryContainer.innerHTML = itineraryHTML;
  }

  // 4. Update Budget Expense Breakdown
  const budgetBreakdownEl = document.getElementById("budget-breakdown-details");
  if (budgetBreakdownEl) {
    budgetBreakdownEl.innerHTML = `
      <div class="row g-2 text-center text-md-start">
        <div class="col-6 col-md-3">
          <div class="p-2 border rounded bg-white">
            <div class="small text-muted"><i class="fa-solid fa-car text-primary me-1"></i> Travel</div>
            <div class="fw-bold">₹${transportEst.toLocaleString()}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="p-2 border rounded bg-white">
            <div class="small text-muted"><i class="fa-solid fa-hotel text-success me-1"></i> Stay</div>
            <div class="fw-bold">₹${stayEst.toLocaleString()}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="p-2 border rounded bg-white">
            <div class="small text-muted"><i class="fa-solid fa-bowl-food text-warning me-1"></i> Food</div>
            <div class="fw-bold">₹${foodEst.toLocaleString()}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="p-2 border rounded bg-white">
            <div class="small text-muted"><i class="fa-solid fa-ticket text-danger me-1"></i> Activities</div>
            <div class="fw-bold">₹${activitiesEst.toLocaleString()}</div>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Save Current Generated Plan to User Profile via Simulated API
 */
async function saveCurrentPlanToProfile() {
  if (!CURRENT_GENERATED_PLAN) return;

  const btn = document.getElementById("save-itinerary-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;
  }

  const primaryDest = CURRENT_GENERATED_PLAN.recommendations[0] || { name: "Maharashtra Destination" };
  const itineraryPayload = {
    title: `${primaryDest.name} Customized Expedition`,
    destination: primaryDest.name,
    days: CURRENT_GENERATED_PLAN.criteria.days,
    budget: CURRENT_GENERATED_PLAN.criteria.budget,
    travelers: CURRENT_GENERATED_PLAN.criteria.travelers,
    transport: CURRENT_GENERATED_PLAN.criteria.transport
  };

  if (window.ExplorerAPI && window.ExplorerAPI.saveUserItineraryAPI) {
    const res = await window.ExplorerAPI.saveUserItineraryAPI(itineraryPayload);
    if (res.success) {
      if (window.showAppToast) {
        window.showAppToast("Itinerary successfully saved to your profile!", "success");
      }
      if (btn) {
        btn.className = "btn btn-sm btn-success";
        btn.innerHTML = `<i class="fa-solid fa-check me-1"></i> Saved to Profile`;
      }
    }
  }
}

/**
 * Print or Save Itinerary
 */
function printItinerary() {
  window.print();
}
