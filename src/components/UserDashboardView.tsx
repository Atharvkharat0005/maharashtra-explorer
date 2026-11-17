import React, { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  CheckCircle,
  Compass,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Heart,
  LogOut,
  MapPin,
  Plus,
  Receipt,
  Shield,
  Trash2,
  User as UserIcon,
  Wallet
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Attraction, BookingStatus, SavedTripRecord, UserProfile } from '../types';
import { VerifiedWikiImage } from './VerifiedWikiImage';

interface UserDashboardViewProps {
  user: UserProfile | null;
  trips: SavedTripRecord[];
  destinations: Attraction[];
  onRequireAuth: () => void;
  onLogout: () => void;
  onTripsChange: (trips: SavedTripRecord[]) => void;
  onLoadTripInPlanner: (trip: SavedTripRecord) => void;
  onSelectDestination: (dest: Attraction) => void;
  onToggleFavorite: (destId: number) => void;
  onGoToSafety: () => void;
  onToast: (msg: string, type?: 'success' | 'danger' | 'info') => void;
}

const EXPENSE_CATEGORIES = [
  'Transportation',
  'Accommodation',
  'Food & Beverages',
  'Entry Fees',
  'Activities',
  'Local Transport',
  'Parking & Tolls',
  'Miscellaneous'
];

const BOOKING_STATUSES: BookingStatus[] = [
  'Recommended',
  'Selected',
  'Booking Initiated',
  'Booking Confirmed',
  'Cancelled'
];

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  user,
  trips,
  destinations,
  onRequireAuth,
  onLogout,
  onTripsChange,
  onLoadTripInPlanner,
  onSelectDestination,
  onToggleFavorite,
  onGoToSafety,
  onToast
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'draft' | 'completed'>('all');
  const [expenseOpenTripId, setExpenseOpenTripId] = useState<string | null>(null);
  const [expenseCategory, setExpenseCategory] = useState<string>('Food & Beverages');
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const [bookingOpenTripId, setBookingOpenTripId] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'Transport' | 'Accommodation' | 'Activity' | 'Restaurant' | 'Permit'>('Accommodation');
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingProvider, setBookingProvider] = useState('');
  const [bookingRef, setBookingRef] = useState('');

  if (!user) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-[#18130f] border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <UserIcon className="w-7 h-7 text-orange-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Your Maharashtra Travel Dashboard
          </h2>
          <p className="text-stone-300 max-w-xl mx-auto mb-7 text-sm sm:text-base">
            Sign in or create an account to save upcoming and draft AI itineraries, track bookings
            and provider reference codes, log group expenses, and keep an emergency contact.
          </p>
          <button
            onClick={onRequireAuth}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b1a] to-[#ff8c38] text-white font-semibold shadow-lg hover:brightness-110 transition cursor-pointer"
          >
            <UserIcon className="w-4 h-4" />
            Sign In or Create Account
          </button>
        </div>
      </section>
    );
  }

  const favoriteDestinations = destinations.filter((d) =>
    user.favoriteDestinationIds?.includes(d.id)
  );

  const filteredTrips = trips.filter((t) =>
    statusFilter === 'all' ? true : t.status === statusFilter
  );

  const handleStatusChange = async (
    tripId: string,
    newStatus: 'upcoming' | 'draft' | 'completed'
  ) => {
    try {
      const res = await apiClient.updateTrip(tripId, { status: newStatus });
      const updated = res?.data;
      if (updated) {
        onTripsChange(trips.map((t) => (t.id === tripId ? updated : t)));
        onToast(`Trip status updated to ${newStatus}.`, 'success');
      }
    } catch (err: any) {
      onToast(err.message || 'Could not update trip status.', 'danger');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await apiClient.deleteTrip(tripId);
      onTripsChange(trips.filter((t) => t.id !== tripId));
      onToast('Saved trip deleted.', 'info');
    } catch (err: any) {
      onToast(err.message || 'Failed to delete trip.', 'danger');
    }
  };

  const handleAddExpense = async (e: React.FormEvent, tripId: string) => {
    e.preventDefault();
    const num = Number(expenseAmount);
    if (!expenseDesc.trim() || !Number.isFinite(num) || num <= 0) {
      onToast('Enter a valid expense description and positive amount.', 'danger');
      return;
    }
    setSubmittingExpense(true);
    try {
      const res = await apiClient.addTripExpense(tripId, {
        category: expenseCategory,
        description: expenseDesc.trim(),
        amount: num
      });
      const updated = res?.data;
      if (updated) {
        onTripsChange(trips.map((t) => (t.id === tripId ? updated : t)));
        setExpenseDesc('');
        setExpenseAmount('');
        setExpenseOpenTripId(null);
        onToast('Expense logged to trip.', 'success');
      }
    } catch (err: any) {
      onToast(err.message || 'Failed to log expense.', 'danger');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleAddBooking = async (e: React.FormEvent, tripId: string) => {
    e.preventDefault();
    if (!bookingTitle.trim() || !bookingProvider.trim()) {
      onToast('Enter booking title and provider.', 'danger');
      return;
    }
    try {
      const res = await apiClient.addTripBooking(tripId, {
        type: bookingType,
        title: bookingTitle.trim(),
        provider: bookingProvider.trim(),
        status: bookingRef.trim() ? 'Booking Confirmed' : 'Booking Initiated',
        referenceCode: bookingRef.trim() || undefined
      });
      if (res?.data) {
        onTripsChange(trips.map((t) => (t.id === tripId ? res.data : t)));
        setBookingTitle('');
        setBookingProvider('');
        setBookingRef('');
        setBookingOpenTripId(null);
        onToast('Booking record added.', 'success');
      }
    } catch (err: any) {
      onToast(err.message || 'Could not add booking.', 'danger');
    }
  };

  const handleBookingUpdate = async (
    tripId: string,
    bookingId: string,
    patch: { status?: BookingStatus; referenceCode?: string }
  ) => {
    try {
      const res = await apiClient.updateTripBooking(tripId, bookingId, patch);
      if (res?.data) {
        onTripsChange(trips.map((t) => (t.id === tripId ? res.data : t)));
        onToast('Booking status updated.', 'success');
      }
    } catch (err: any) {
      onToast(err.message || 'Could not update booking.', 'danger');
    }
  };

  const handleDeleteBooking = async (tripId: string, bookingId: string) => {
    try {
      const res = await apiClient.deleteTripBooking(tripId, bookingId);
      if (res?.data) {
        onTripsChange(trips.map((t) => (t.id === tripId ? res.data : t)));
        onToast('Booking removed from trip.', 'info');
      }
    } catch (err: any) {
      onToast(err.message || 'Could not remove booking.', 'danger');
    }
  };

  const buildShareText = (trip: SavedTripRecord) => {
    const lines = [
      `MAHARASHTRA EXPLORER — ${trip.title}`,
      `Status: ${trip.status.toUpperCase()} | Start: ${trip.startDate} | Days: ${trip.days}`,
      `Origin: ${trip.startingLocation} | Group Size: ${trip.groupSize} | Total Group Budget: INR ${trip.totalGroupBudget.toLocaleString('en-IN')}`,
      `Destinations: ${(trip.destinations || []).join(', ')}`
    ];
    if (Array.isArray(trip.itinerary?.days)) {
      lines.push('', 'DAY-BY-DAY PLAN:');
      trip.itinerary.days.forEach((d: any) => {
        lines.push(`Day ${d.dayNumber}: ${d.title || d.baseLocation || ''}`);
        if (d.breakfast) lines.push(`  Meals: ${d.breakfast} | ${d.lunch} | ${d.dinner}`);
      });
    }
    return lines.join('\n');
  };

  const handleCopyTrip = async (trip: SavedTripRecord) => {
    try {
      await navigator.clipboard.writeText(buildShareText(trip));
      onToast('Trip summary copied to clipboard.', 'success');
    } catch {
      onToast('Clipboard access unavailable.', 'danger');
    }
  };

  const handleDownloadJson = (trip: SavedTripRecord) => {
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Trip JSON downloaded.', 'success');
  };

  const handleDownloadText = (trip: SavedTripRecord) => {
    const blob = new Blob([buildShareText(trip)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Printable text itinerary downloaded.', 'success');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* User Profile Header */}
      <div className="bg-[#18130f] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff6b1a] to-[#d94e07] flex items-center justify-center text-white font-bold text-xl shrink-0">
            {user.fullName
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{user.fullName}</h1>
              <span className="text-xs font-semibold text-amber-300">{user.tier}</span>
            </div>
            <p className="text-sm text-stone-300 mt-1">
              {user.email} · {user.homeCity || 'Maharashtra'} ·{' '}
              <span className="tabular-nums">{trips.length} saved trips</span> ·{' '}
              <span className="tabular-nums">{favoriteDestinations.length} favourites</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-stone-300">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Trusted Contact:{' '}
                {user.trustedEmergencyContact?.name
                  ? `${user.trustedEmergencyContact.name} (${user.trustedEmergencyContact.phone})`
                  : 'Not set'}
              </span>
              <button
                onClick={onGoToSafety}
                className="text-orange-400 hover:text-orange-300 underline cursor-pointer"
              >
                Manage Emergency Settings
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/15 hover:border-red-500/40 text-white hover:text-red-300 text-sm font-medium transition cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Saved Trips, Bookings & Expense Tracker */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-orange-400" />
              Saved Trips, Booking Management &amp; Expenses
            </h2>
            <p className="text-sm text-stone-300">
              Resume incomplete drafts, manage external booking confirmation references, and log
              group expenses against your trip budget.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'upcoming', 'draft', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#18130f] text-stone-200 border border-white/10 hover:border-orange-500/40'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="bg-[#18130f] border border-white/10 rounded-2xl p-8 text-center">
            <Compass className="w-8 h-8 text-stone-400 mx-auto mb-3" />
            <p className="text-white font-medium">No trips in this category yet.</p>
            <p className="text-stone-300 text-sm mt-1">
              Generate an itinerary in MAHATRIP AI Planner and save it as upcoming or draft.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTrips.map((trip) => {
              const totalLogged = (trip.expensesLogged || []).reduce(
                (acc, item) => acc + (Number(item.amount) || 0),
                0
              );
              const budgetPct =
                trip.totalGroupBudget > 0
                  ? Math.min(100, Math.round((totalLogged / trip.totalGroupBudget) * 100))
                  : 0;
              const isOverLogged = totalLogged > trip.totalGroupBudget;
              const bookings = trip.bookings || [];

              return (
                <div
                  key={trip.id}
                  className="bg-[#18130f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{trip.title}</h3>
                        <p className="text-xs text-stone-300 mt-1">
                          From {trip.startingLocation} ·{' '}
                          <span className="tabular-nums">
                            {trip.days === 1 ? '1-Day Same-Day Return' : `${trip.days} Days`}
                          </span>{' '}
                          · <span className="tabular-nums">{trip.groupSize} Travelers</span> ·{' '}
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Calendar className="w-3 h-3" />
                            {trip.startDate}
                          </span>
                        </p>
                      </div>
                      <select
                        value={trip.status}
                        onChange={(e) =>
                          handleStatusChange(
                            trip.id,
                            e.target.value as 'upcoming' | 'draft' | 'completed'
                          )
                        }
                        aria-label="Trip status"
                        className="bg-[#110d0a] border border-white/15 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-300 focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="draft">Draft</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {trip.destinations && trip.destinations.length > 0 && (
                      <p className="text-sm text-stone-200 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        <span>{trip.destinations.join(' · ')}</span>
                      </p>
                    )}

                    {/* Group Budget & Expense Progress */}
                    <div className="p-4 rounded-xl bg-[#110d0a] border border-white/10">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-stone-300 flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-orange-400" />
                          Group Expenses Logged
                        </span>
                        <span
                          className={`font-semibold tabular-nums ${
                            isOverLogged ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          ₹{totalLogged.toLocaleString('en-IN')} / ₹
                          {trip.totalGroupBudget.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isOverLogged ? 'bg-rose-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>

                      {(trip.expensesLogged || []).length > 0 && (
                        <ul className="mt-3 space-y-1.5 max-h-28 overflow-y-auto text-xs text-stone-200 custom-scrollbar">
                          {trip.expensesLogged.map((exp) => (
                            <li
                              key={exp.id}
                              className="flex items-center justify-between border-t border-white/10 pt-1.5"
                            >
                              <span className="truncate pr-2">
                                <strong className="text-white">{exp.category}:</strong>{' '}
                                {exp.description}
                              </span>
                              <span className="tabular-nums text-amber-300 shrink-0">
                                ₹{Number(exp.amount).toLocaleString('en-IN')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {expenseOpenTripId === trip.id && (
                        <form
                          onSubmit={(e) => handleAddExpense(e, trip.id)}
                          className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2"
                        >
                          <select
                            value={expenseCategory}
                            onChange={(e) => setExpenseCategory(e.target.value)}
                            className="bg-[#18130f] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          >
                            {EXPENSE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Description"
                            value={expenseDesc}
                            onChange={(e) => setExpenseDesc(e.target.value)}
                            required
                            className="bg-[#18130f] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min={1}
                              placeholder="₹ Amount"
                              value={expenseAmount}
                              onChange={(e) => setExpenseAmount(e.target.value)}
                              required
                              className="w-full bg-[#18130f] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white tabular-nums"
                            />
                            <button
                              type="submit"
                              disabled={submittingExpense}
                              className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 cursor-pointer shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Section 11: Booking Management Panel */}
                    <div className="p-4 rounded-xl bg-[#110d0a] border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                          Bookings &amp; Provider References ({bookings.length})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setBookingOpenTripId(bookingOpenTripId === trip.id ? null : trip.id)
                          }
                          className="text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                        >
                          + Add Booking Ref
                        </button>
                      </div>

                      {bookings.length === 0 ? (
                        <p className="text-[11px] text-stone-400">
                          No booking references recorded yet. Confirmation requires an external
                          provider PNR / reservation code.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {bookings.map((b) => (
                            <div
                              key={b.id}
                              className="p-2.5 rounded-lg bg-[#18130f] border border-white/10 text-xs space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[10px] uppercase tracking-wider text-orange-400 font-bold">
                                    {b.type}
                                  </span>
                                  <p className="font-semibold text-white">{b.title}</p>
                                  <p className="text-[11px] text-stone-300">{b.provider}</p>
                                </div>
                                <select
                                  value={b.status}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value as BookingStatus;
                                    if (nextStatus === 'Booking Confirmed' && !b.referenceCode) {
                                      onToast(
                                        'Enter your official provider confirmation reference code first.',
                                        'info'
                                      );
                                      return;
                                    }
                                    handleBookingUpdate(trip.id, b.id, { status: nextStatus });
                                  }}
                                  className="bg-[#110d0a] border border-white/15 rounded px-2 py-1 text-[11px] text-amber-300"
                                >
                                  {BOOKING_STATUSES.map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  defaultValue={b.referenceCode || ''}
                                  placeholder="Provider PNR / Booking Ref..."
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val !== (b.referenceCode || '')) {
                                      handleBookingUpdate(trip.id, b.id, {
                                        referenceCode: val,
                                        status: val ? 'Booking Confirmed' : b.status
                                      });
                                    }
                                  }}
                                  className="flex-1 min-w-[140px] bg-[#110d0a] border border-white/15 rounded px-2 py-1 text-[11px] text-white"
                                />
                                {b.bookingUrl && (
                                  <a
                                    href={b.bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:underline"
                                  >
                                    Portal <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBooking(trip.id, b.id)}
                                  title="Remove booking"
                                  aria-label={`Remove ${b.title}`}
                                  className="p-1 rounded text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {bookingOpenTripId === trip.id && (
                        <form
                          onSubmit={(e) => handleAddBooking(e, trip.id)}
                          className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"
                        >
                          <select
                            value={bookingType}
                            onChange={(e) => setBookingType(e.target.value as any)}
                            className="bg-[#18130f] border border-white/15 rounded-lg px-2 py-1.5 text-white"
                          >
                            <option value="Transport">Transport (Train/Bus/Cab)</option>
                            <option value="Accommodation">Hotel / Resort Stay</option>
                            <option value="Activity">Activity / Safari Permit</option>
                            <option value="Restaurant">Dining Reservation</option>
                            <option value="Permit">Forest / ASI Entry Ticket</option>
                          </select>
                          <input
                            required
                            placeholder="Title (e.g. Konkan Kanya Express)"
                            value={bookingTitle}
                            onChange={(e) => setBookingTitle(e.target.value)}
                            className="bg-[#18130f] border border-white/15 rounded-lg px-2 py-1.5 text-white"
                          />
                          <input
                            required
                            placeholder="Provider (e.g. IRCTC, MTDC)"
                            value={bookingProvider}
                            onChange={(e) => setBookingProvider(e.target.value)}
                            className="bg-[#18130f] border border-white/15 rounded-lg px-2 py-1.5 text-white"
                          />
                          <div className="flex gap-1.5">
                            <input
                              placeholder="PNR / Ref (Optional)"
                              value={bookingRef}
                              onChange={(e) => setBookingRef(e.target.value)}
                              className="flex-1 bg-[#18130f] border border-white/15 rounded-lg px-2 py-1.5 text-white"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => onLoadTripInPlanner(trip)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Open in Planner
                    </button>
                    <button
                      onClick={() =>
                        setExpenseOpenTripId(expenseOpenTripId === trip.id ? null : trip.id)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-100 text-xs font-medium border border-white/10 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Log Expense
                    </button>
                    <button
                      onClick={() => handleDownloadText(trip)}
                      title="Download printable summary"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-100 text-xs font-medium border border-white/10 transition cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      TXT
                    </button>
                    <button
                      onClick={() => handleDownloadJson(trip)}
                      title="Download JSON"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-100 text-xs font-medium border border-white/10 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JSON
                    </button>
                    <button
                      onClick={() => handleCopyTrip(trip)}
                      title="Copy shareable trip summary"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-100 text-xs font-medium border border-white/10 transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Share
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      title="Delete trip"
                      className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/15 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Favourite Places */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-400" />
          Favourite Destinations
        </h2>
        {favoriteDestinations.length === 0 ? (
          <div className="bg-[#18130f] border border-white/10 rounded-2xl p-6 text-sm text-stone-300">
            No destinations bookmarked yet. Click the heart icon on any Maharashtra destination to
            save it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favoriteDestinations.map((dest) => (
              <div
                key={dest.id}
                className="bg-[#18130f] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="h-40 relative">
                  <VerifiedWikiImage
                    wikiTitle={dest.wikiTitle}
                    alt={dest.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">{dest.name}</h3>
                    <p className="text-xs text-stone-300 mt-0.5">
                      {dest.division} · {dest.districtName} · {dest.category}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => onSelectDestination(dest)}
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onToggleFavorite(dest.id)}
                      className="text-xs text-stone-300 hover:text-red-400 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Local Operator Inquiries */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          Travel Operator Inquiries
        </h2>
        {!user.inquiries || user.inquiries.length === 0 ? (
          <div className="bg-[#18130f] border border-white/10 rounded-2xl p-6 text-sm text-stone-300">
            No operator quote requests logged yet.
          </div>
        ) : (
          <div className="bg-[#18130f] border border-white/10 rounded-2xl divide-y divide-white/10">
            {user.inquiries.map((inq) => (
              <div
                key={inq.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div>
                  <span className="font-semibold text-white">{inq.agentName}</span>
                  <p className="text-xs text-stone-300">{inq.package}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-400 font-semibold">{inq.status}</span>
                  <span className="text-stone-400 tabular-nums">{inq.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
