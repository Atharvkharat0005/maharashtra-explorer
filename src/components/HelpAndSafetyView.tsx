import React, { useEffect, useState } from 'react';
import {
  Bike,
  Calculator,
  ExternalLink,
  HelpCircle,
  Phone,
  Shield,
  Star,
  Users
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Attraction, TravelAgent } from '../types';
import { SafetyAndMapView } from './SafetyAndMapView';

interface HelpAndSafetyViewProps {
  destinations: Attraction[];
  agents: TravelAgent[];
  onSelectDestination: (dest: Attraction) => void;
  trustedContact?: { name: string; phone: string };
  isAuthenticated: boolean;
  onSaveTrustedContact: (name: string, phone: string) => Promise<void>;
  onOpenAgentContact: (agent: TravelAgent) => void;
  onOpenAgentPackages: (agent: TravelAgent) => void;
  onToast: (msg: string, type?: 'success' | 'danger' | 'info') => void;
}

export const HelpAndSafetyView: React.FC<HelpAndSafetyViewProps> = ({
  destinations,
  agents,
  onSelectDestination,
  trustedContact,
  isAuthenticated,
  onSaveTrustedContact,
  onOpenAgentContact,
  onOpenAgentPackages,
  onToast
}) => {
  const [bookingLinks, setBookingLinks] = useState<Record<string, { label: string; url: string; note: string }> | null>(null);

  useEffect(() => {
    apiClient
      .getBookingLinks()
      .then((res) => setBookingLinks(res?.data || null))
      .catch(() => setBookingLinks(null));
  }, []);

  return (
    <div className="space-y-12 pb-16">
      <SafetyAndMapView
        destinations={destinations}
        onSelectDestination={onSelectDestination}
        trustedContact={trustedContact}
        isAuthenticated={isAuthenticated}
        onSaveTrustedContact={onSaveTrustedContact}
        onToast={onToast}
      />

      {/* How One-Day Trip, Total Group Budget & Bike Fuel Math Work */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
            Transparent Methodology
          </p>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mt-1">
            <HelpCircle className="w-5 h-5 text-orange-400" />
            How MAHATRIP AI Calculates Budgets &amp; Bike Journeys
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="bg-[#18130f] border border-white/10 rounded-2xl p-5 space-y-2">
            <p className="font-bold text-sm text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-orange-400" />
              Strict Total Group Budget
            </p>
            <p className="text-stone-300 leading-relaxed">
              Your entered budget is always treated as the maximum spending limit for the{' '}
              <strong className="text-white">entire group</strong> — never per person. Essential
              costs (travel/fuel, meals, parking, entry tickets, emergency buffer) are tracked separately
              from optional paid activities like boating or guides.
            </p>
          </div>

          <div className="bg-[#18130f] border border-white/10 rounded-2xl p-5 space-y-2">
            <p className="font-bold text-sm text-white flex items-center gap-2">
              <Bike className="w-4 h-4 text-amber-400" />
              Bike Mileage &amp; Highway Rules
            </p>
            <p className="text-stone-300 leading-relaxed">
              Fuel cost uses{' '}
              <span className="text-amber-300 font-semibold">
                (Round-Trip OSRM Road km + Sightseeing Detour) ÷ Mileage × Petrol Price
              </span>
              . Two-wheelers pay ₹0 toll on Maharashtra highways and must take the{' '}
              <strong className="text-white">Old Highway (NH48 / SH)</strong> because motorcycles are
              prohibited on Expressways.
            </p>
          </div>

          <div className="bg-[#18130f] border border-white/10 rounded-2xl p-5 space-y-2">
            <p className="font-bold text-sm text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Same-Day Return Safeguards
            </p>
            <p className="text-stone-300 leading-relaxed">
              One-Day Trips never include overnight hotels or spill into a second day. MAHATRIP AI
              checks distance and travel time so you depart in the morning, keep rest and meal
              buffers, and return safely before late night.
            </p>
          </div>
        </div>
      </section>

      {/* Official Booking Portals */}
      {bookingLinks && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
              Official Government &amp; Partner Portals
            </p>
            <h2 className="text-2xl font-bold text-white mt-1">
              Where to Book Verified Tickets &amp; Permits
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              MAHATRIP AI never fabricates live seat counts or confirms transactions internally — verify
              availability and complete bookings directly on these official portals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.entries(bookingLinks) as Array<[string, { label: string; url: string; note: string }]>).map(([key, item]) => (
              <a
                key={key}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#18130f] hover:bg-[#1f1812] border border-white/10 hover:border-orange-500/40 rounded-2xl p-5 flex flex-col justify-between gap-3 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{item.label}</h3>
                    <ExternalLink className="w-4 h-4 text-orange-400 shrink-0" />
                  </div>
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">{item.note}</p>
                </div>
                <span className="text-xs font-semibold text-orange-400">Open Official Website →</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Regional Travel Operators Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
            Regional Specialists
          </p>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mt-1">
            <Users className="w-5 h-5 text-orange-400" />
            Maharashtra Travel Operators Directory
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Connect directly for guided fort treks, Konkan scuba packages, Vidarbha safaris, or custom cab support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-[#18130f] border border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{agent.name}</h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {agent.location} · {agent.division}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 tabular-nums shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {agent.rating} ({agent.reviewsCount})
                  </span>
                </div>
                <p className="text-xs text-emerald-400 font-medium mt-2">{agent.verifiedBadge}</p>
                <p className="text-xs text-stone-300 mt-2">{agent.specialization}</p>
                <p className="text-xs text-stone-400 mt-2 flex items-center gap-1.5 tabular-nums">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  {agent.phone}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => onOpenAgentPackages(agent)}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-stone-200 transition cursor-pointer"
                >
                  View Packages
                </button>
                <button
                  onClick={() => onOpenAgentContact(agent)}
                  className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Request Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
