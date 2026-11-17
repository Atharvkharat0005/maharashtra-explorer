import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle,
  Compass,
  Info,
  LogIn,
  LogOut,
  Menu,
  Phone,
  Shield,
  User as UserIcon,
  X
} from 'lucide-react';
import { DestinationDetailModal } from './components/DestinationDetailModal';
import { ExploreMaharashtraView } from './components/ExploreMaharashtraView';
import { HelpAndSafetyView } from './components/HelpAndSafetyView';
import { HomeView } from './components/HomeView';
import { LanguageSelector } from './components/LanguageSelector';
import { MahatripChatDrawer } from './components/MahatripChatDrawer';
import { MahatripPlannerView } from './components/MahatripPlannerView';
import { UserDashboardView } from './components/UserDashboardView';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { apiClient, getStoredToken, setStoredToken } from './services/apiClient';
import {
  Attraction,
  District,
  DivisionName,
  SavedTripRecord,
  TravelAgent,
  UserProfile,
  ViewTab
} from './types';

interface ToastState {
  message: string;
  type: 'success' | 'danger' | 'info';
}

function AppInner() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ViewTab>('home');
  const [exploreSection, setExploreSection] = useState<'districts' | 'hidden-gems'>('districts');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [destinations, setDestinations] = useState<Attraction[]>([]);
  const [hiddenGems, setHiddenGems] = useState<Attraction[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [agents, setAgents] = useState<TravelAgent[]>([]);
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTripRecord[]>([]);

  const [selectedDestination, setSelectedDestination] = useState<Attraction | null>(null);
  const [plannerPreselectDest, setPlannerPreselectDest] = useState<Attraction | null>(null);
  const [plannerPreselectDistrict, setPlannerPreselectDistrict] = useState<string | null>(null);
  const [plannerDraftTrip, setPlannerDraftTrip] = useState<SavedTripRecord | null>(null);
  const [activeItinerary, setActiveItinerary] = useState<any | null>(null);
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('All');

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authCity, setAuthCity] = useState('Pune');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Agent inquiry / packages modals
  const [contactAgent, setContactAgent] = useState<TravelAgent | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [packagesAgent, setPackagesAgent] = useState<TravelAgent | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'danger' | 'info' = 'info') => {
      setToast({ message, type });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const loadAuthenticatedUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setSavedTrips([]);
      return;
    }
    try {
      const [profileRes, tripsRes] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getTrips()
      ]);
      setUser(profileRes?.data || null);
      setSavedTrips(tripsRes?.data || []);
    } catch {
      setStoredToken(null);
      setUser(null);
      setSavedTrips([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      setLoadingBootstrap(true);
      try {
        const [destRes, gemsRes, distRes, agentsRes] = await Promise.all([
          apiClient.getDestinations(),
          apiClient.getHiddenGems(),
          apiClient.getDistricts(),
          apiClient.getTravelAgents()
        ]);
        if (!active) return;
        setDestinations(destRes?.data || []);
        setHiddenGems(gemsRes?.data || []);
        setDistricts(distRes?.data || []);
        setAgents(agentsRes?.data || []);
      } catch (err: any) {
        if (active) {
          showToast(err?.message || 'Failed to load Maharashtra destinations data.', 'danger');
        }
      } finally {
        if (active) setLoadingBootstrap(false);
      }
    }
    bootstrap();
    loadAuthenticatedUser();
    return () => {
      active = false;
    };
  }, [loadAuthenticatedUser, showToast]);

  const navigateTab = (tab: ViewTab, nextExploreSection?: 'districts' | 'hidden-gems') => {
    if (nextExploreSection) {
      setExploreSection(nextExploreSection);
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setSavedTrips([]);
    showToast('You have signed out cleanly.', 'info');
    if (activeTab === 'dashboard') {
      navigateTab('home');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      const res =
        authMode === 'login'
          ? await apiClient.login(authEmail, authPassword)
          : await apiClient.register({
              fullName: authFullName,
              email: authEmail,
              password: authPassword,
              phone: authPhone,
              homeCity: authCity
            });
      const token = res?.data?.token;
      const profile = res?.data?.user;
      if (token) {
        setStoredToken(token);
      }
      if (profile) {
        setUser(profile);
      }
      await loadAuthenticatedUser();
      setAuthModalOpen(false);
      setAuthPassword('');
      showToast(
        authMode === 'login' ? 'Signed in to Maharashtra Explorer.' : 'Account created!',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Authentication failed.', 'danger');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const fillDemoUser = () => {
    setAuthMode('login');
    setAuthEmail('demo.traveler@example.com');
    setAuthPassword('Password123');
  };

  const handleToggleFavorite = async (destId: number) => {
    if (!user) {
      setAuthModalOpen(true);
      showToast('Sign in to save favourite Maharashtra destinations.', 'info');
      return;
    }
    try {
      const res = await apiClient.toggleFavorite(destId);
      const favs: number[] = res?.data?.favoriteDestinationIds || [];
      setUser((prev) => (prev ? { ...prev, favoriteDestinationIds: favs } : prev));
      showToast(
        res?.data?.isFavorite ? 'Added to favourites.' : 'Removed from favourites.',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Could not update favourite.', 'danger');
    }
  };

  const handleSaveTrustedContact = async (name: string, phone: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      const res = await apiClient.updateTrustedContact(name, phone);
      setUser((prev) =>
        prev ? { ...prev, trustedEmergencyContact: res?.data?.trustedEmergencyContact } : prev
      );
      showToast('Trusted emergency contact updated.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Could not save trusted contact.', 'danger');
    }
  };

  const handlePlanForDestination = (dest: Attraction) => {
    setSelectedDestination(null);
    setPlannerPreselectDest(dest);
    setPlannerPreselectDistrict(dest.districtName);
    setPlannerDraftTrip(null);
    navigateTab('planner');
  };

  const handlePlanForDistrict = (districtName: string) => {
    setPlannerPreselectDest(null);
    setPlannerPreselectDistrict(districtName);
    setPlannerDraftTrip(null);
    navigateTab('planner');
  };

  const handleOpenAgentContact = (agent: TravelAgent, pkgTitle?: string) => {
    setPackagesAgent(null);
    setContactAgent(agent);
    setContactName(user?.fullName || '');
    setContactPhone(user?.phone || '');
    setContactMsg(
      pkgTitle
        ? `Interested in package: ${pkgTitle}. Please share dates and group pricing.`
        : `Looking for a customized Maharashtra trip itinerary with ${agent.name}.`
    );
  };

  const handleSubmitAgentInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactAgent) return;
    try {
      await apiClient.submitAgentInquiry({
        agentName: contactAgent.name,
        customerName: contactName,
        phone: contactPhone,
        message: contactMsg
      });
      setContactAgent(null);
      if (user) {
        await loadAuthenticatedUser();
      }
      showToast(`Inquiry logged for ${contactAgent.name}.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Could not send operator inquiry.', 'danger');
    }
  };

  const handleLoadTripInPlanner = (trip: SavedTripRecord) => {
    setPlannerDraftTrip(trip);
    if (trip.itinerary) {
      setActiveItinerary(trip.itinerary);
    }
    navigateTab('planner');
  };

  const NAV_ITEMS: Array<{ id: ViewTab; label: string }> = [
    { id: 'home', label: t('nav.home', 'Home') },
    { id: 'planner', label: t('nav.planner', 'Plan a Trip') },
    { id: 'explore', label: t('nav.explore', 'Explore') },
    { id: 'dashboard', label: t('nav.dashboard', 'My Trips') },
    { id: 'help', label: t('nav.help', 'Help & Safety') }
  ];

  return (
    <div className="min-h-screen bg-[#0d0b09] text-stone-100 flex flex-col">
      {/* Top Navigation Bar (Clean 5-Link Typographic Nav) */}
      <header className="sticky top-0 z-40 bg-[#0d0b09]/92 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Brand Title */}
          <button
            onClick={() => navigateTab('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
          >
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6b1a] to-[#d94e07] flex items-center justify-center shadow">
              <Compass className="w-5 h-5 text-white" />
            </span>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap shrink-0">
              {t('brand.title', 'Maharashtra')}{' '}
              <span className="text-orange-400">{t('brand.highlight', 'Explorer')}</span>
            </span>
          </button>

          {/* Zone 2: 5 Primary Nav Links */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTab(item.id)}
                className={`py-5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition cursor-pointer ${
                  activeTab === item.id
                    ? 'border-orange-500 text-white'
                    : 'border-transparent text-stone-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Account Control & Language Switcher at the very right of the header */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigateTab('dashboard')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18130f] border border-white/15 hover:border-orange-500/50 text-xs sm:text-sm font-semibold text-white whitespace-nowrap transition cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-amber-400" />
                  <span>{user.fullName.split(' ')[0]}</span>
                </button>
                <button
                  onClick={handleLogout}
                  title={t('nav.signOut', 'Sign out')}
                  aria-label={t('nav.signOut', 'Sign out')}
                  className="p-2 rounded-xl bg-[#18130f] border border-white/10 hover:border-red-500/40 text-stone-300 hover:text-red-400 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff6b1a] to-[#ff8c38] text-white text-xs sm:text-sm font-semibold whitespace-nowrap hover:brightness-110 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('nav.signIn', 'Sign In')}</span>
              </button>
            )}

            {/* Language Selector at the very right */}
            <LanguageSelector />

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={t('nav.toggleMenu', 'Toggle mobile menu')}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-stone-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#14100d] px-4 py-3 space-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTab(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-orange-500 text-white'
                    : 'text-stone-300 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-white/10">
              <LanguageSelector variant="mobile" />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {loadingBootstrap ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center text-stone-400">
            Loading Maharashtra 36 districts and destinations...
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                destinations={destinations}
                hiddenGems={hiddenGems}
                districts={districts}
                favoriteIds={user?.favoriteDestinationIds || []}
                onToggleFavorite={handleToggleFavorite}
                onSelectDestination={(d) => setSelectedDestination(d)}
                onPlanForDestination={handlePlanForDestination}
                onNavigateTab={navigateTab}
                onSelectDivision={(division: DivisionName) => {
                  setSelectedDivisionFilter(division);
                  navigateTab('explore', 'districts');
                }}
              />
            )}

            {activeTab === 'explore' && (
              <ExploreMaharashtraView
                initialSection={exploreSection}
                initialDivision={selectedDivisionFilter}
                onSelectDestination={(d) => setSelectedDestination(d)}
                onPlanForDestination={handlePlanForDestination}
                onPlanForDistrict={handlePlanForDistrict}
              />
            )}

            {activeTab === 'planner' && (
              <MahatripPlannerView
                destinations={destinations}
                districts={districts}
                agents={agents}
                preselectedDestination={plannerPreselectDest}
                preselectedDistrictName={plannerPreselectDistrict}
                isAuthenticated={Boolean(user)}
                onRequireAuth={() => setAuthModalOpen(true)}
                onActiveItineraryChange={(itin) => setActiveItinerary(itin)}
                onOpenAgentContact={(agent, pkg) => handleOpenAgentContact(agent, pkg)}
                onToast={showToast}
                initialDraftTrip={plannerDraftTrip}
                onTripSaved={loadAuthenticatedUser}
              />
            )}

            {activeTab === 'help' && (
              <HelpAndSafetyView
                destinations={destinations}
                agents={agents}
                onSelectDestination={(d) => setSelectedDestination(d)}
                trustedContact={user?.trustedEmergencyContact}
                isAuthenticated={Boolean(user)}
                onSaveTrustedContact={handleSaveTrustedContact}
                onOpenAgentContact={(agent) => handleOpenAgentContact(agent)}
                onOpenAgentPackages={(agent) => setPackagesAgent(agent)}
                onToast={showToast}
              />
            )}

            {activeTab === 'dashboard' && (
              <UserDashboardView
                user={user}
                trips={savedTrips}
                destinations={destinations}
                onRequireAuth={() => setAuthModalOpen(true)}
                onLogout={handleLogout}
                onTripsChange={(next) => setSavedTrips(next)}
                onLoadTripInPlanner={handleLoadTripInPlanner}
                onSelectDestination={(d) => setSelectedDestination(d)}
                onToggleFavorite={handleToggleFavorite}
                onGoToSafety={() => navigateTab('help')}
                onToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#090705] border-t border-white/10 py-9 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-6 text-xs text-stone-400">
          <div>
            <p className="font-bold text-white text-sm">
              {t('footer.brand', 'Maharashtra Explorer · Powered by MAHATRIP AI')}
            </p>
            <p className="mt-1">
              {t('footer.motto', 'Discover Maharashtra · Plan Smarter · Travel Within Your Budget.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 tabular-nums">
            <span className="inline-flex items-center gap-1.5 text-red-400 font-semibold">
              <Shield className="w-4 h-4" />
              {t('footer.emergency', 'India Emergency: 112')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Phone className="w-4 h-4" />
              {t('footer.helpline', 'MTDC Helpline: 1800-229-930')}
            </span>
          </div>
        </div>
      </footer>

      {/* Floating During-Trip MAHATRIP AI Chat Assistant */}
      <MahatripChatDrawer activeItinerary={activeItinerary} />

      {/* Destination Detail Modal */}
      <DestinationDetailModal
        destination={selectedDestination}
        isFavorite={Boolean(
          selectedDestination && user?.favoriteDestinationIds?.includes(selectedDestination.id)
        )}
        onToggleFavorite={handleToggleFavorite}
        onClose={() => setSelectedDestination(null)}
        onPlanForDestination={handlePlanForDestination}
      />

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18130f] border border-white/15 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setAuthModalOpen(false)}
              aria-label="Close sign in dialog"
              className="absolute top-4 right-4 text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white">
              {authMode === 'login' ? t('auth.signInTitle', 'Sign In to Maharashtra Explorer') : t('auth.registerTitle', 'Create Traveler Account')}
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              {t('auth.subtitle', 'Save AI trips, log group expenses, and keep trusted safety contacts.')}
            </p>

            <form onSubmit={handleAuthSubmit} className="mt-5 space-y-3.5 text-sm">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs text-stone-300 mb-1">{t('auth.fullName', 'Full Name')}</label>
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="e.g., Aarav Deshmukh"
                      className="w-full bg-[#110d0a] border border-white/15 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-stone-300 mb-1">{t('auth.homeCity', 'Home City')}</label>
                      <input
                        type="text"
                        value={authCity}
                        onChange={(e) => setAuthCity(e.target.value)}
                        className="w-full bg-[#110d0a] border border-white/15 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-300 mb-1">{t('auth.phone', 'Phone')}</label>
                      <input
                        type="text"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="+91 ..."
                        className="w-full bg-[#110d0a] border border-white/15 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs text-stone-300 mb-1">{t('auth.email', 'Email')}</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="traveler@example.com"
                  className="w-full bg-[#110d0a] border border-white/15 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1">{t('auth.password', 'Password')}</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-[#110d0a] border border-white/15 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b1a] to-[#ff8c38] text-white font-semibold hover:brightness-110 transition cursor-pointer"
              >
                {authSubmitting
                  ? 'Please wait...'
                  : authMode === 'login'
                  ? t('auth.submitLogin', 'Sign In')
                  : t('auth.submitRegister', 'Create Account')}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2 text-xs">
              <button
                type="button"
                onClick={fillDemoUser}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 font-medium cursor-pointer"
              >
                {t('auth.demoBtn', 'Use Demo Traveler Credentials (demo.traveler@example.com)')}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-stone-400 hover:text-white underline cursor-pointer mt-1"
              >
                {authMode === 'login'
                  ? t('auth.needAccount', "Don't have an account? Register")
                  : t('auth.haveAccount', 'Already registered? Sign in')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Packages Modal */}
      {packagesAgent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18130f] border border-white/15 rounded-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setPackagesAgent(null)}
              aria-label="Close packages"
              className="absolute top-4 right-4 text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white">{packagesAgent.name}</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {packagesAgent.location} · {packagesAgent.specialization}
            </p>
            <div className="mt-4 space-y-3">
              {packagesAgent.packages.map((pkg) => (
                <div
                  key={pkg.title}
                  className="p-3.5 rounded-xl bg-[#110d0a] border border-white/10 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-semibold text-sm text-white">{pkg.title}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{pkg.duration}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-amber-400 tabular-nums">{pkg.price}</div>
                    <button
                      onClick={() => handleOpenAgentContact(packagesAgent, pkg.title)}
                      className="text-xs text-orange-400 hover:text-orange-300 underline cursor-pointer mt-1"
                    >
                      Inquire
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agent Inquiry Modal */}
      {contactAgent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18130f] border border-white/15 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setContactAgent(null)}
              aria-label="Close inquiry modal"
              className="absolute top-4 right-4 text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white">Request Quote: {contactAgent.name}</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {contactAgent.location} · {contactAgent.phone}
            </p>
            <form onSubmit={handleSubmitAgentInquiry} className="mt-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs text-stone-300 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-[#110d0a] border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-300 mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-[#110d0a] border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-300 mb-1">Trip Requirements</label>
                <textarea
                  rows={3}
                  required
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="w-full bg-[#110d0a] border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold cursor-pointer"
              >
                Send Inquiry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm max-w-sm ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
              : toast.type === 'danger'
              ? 'bg-red-950/95 border-red-500/40 text-red-200'
              : 'bg-[#1f1914]/95 border-white/15 text-stone-100'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-orange-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

export default App;
