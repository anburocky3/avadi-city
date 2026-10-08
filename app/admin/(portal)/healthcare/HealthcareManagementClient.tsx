"use client";

import React, { useState } from "react";
import {
  HeartPulse,
  Plus,
  Search,
  Trash2,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { initialHealthcareSpots } from "@/data/healthcareSpots";

export function HealthcareManagementClient() {
  const [spots, setSpots] = useState(initialHealthcareSpots);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpot, setNewSpot] = useState({
    name: "",
    type: "Hospital",
    category: "Multispeciality Hospital",
    address: "",
    ward: 14,
    phone: "",
    is24x7: true,
    timings: "24 Hours / 7 Days",
  });

  const handleDelete = (id: string | number) => {
    if (!confirm("Are you sure you want to remove this healthcare center?")) return;
    setSpots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: any = {
      id: `health-${Date.now()}`,
      name: newSpot.name,
      type: newSpot.type,
      category: newSpot.category,
      address: newSpot.address,
      ward: Number(newSpot.ward),
      phone: newSpot.phone,
      is24x7: newSpot.is24x7,
      timings: newSpot.timings,
    };
    setSpots([created, ...spots]);
    setShowAddModal(false);
  };

  const filteredSpots = spots.filter(
    (s: any) =>
      searchQuery === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hospitals & Healthcare Directory Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain verified government hospitals, 24x7 emergency casualties, and certified pharmacies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/healthcare"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>Live Healthcare View</span>
            <ExternalLink size={13} />
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus size={15} />
            <span>Add Medical Center</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search hospital, pharmacy, blood bank..."
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSpots.map((spot) => (
          <div
            key={spot.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-xs space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  {(spot as any).category || (spot as any).type || "Hospital"}
                </span>
                {spot.is24x7 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    24/7 Casualty
                  </span>
                )}
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                {spot.name}
              </h3>
              <p className="text-xs text-slate-500">{spot.category}</p>

              <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400" />
                  <span className="truncate">{spot.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" />
                  <span className="font-mono">{spot.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-slate-400" />
                  <span>{spot.timings}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600">Verified Center</span>
              <button
                onClick={() => handleDelete(spot.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add Healthcare Facility</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Center / Hospital Name *</label>
                <input
                  type="text"
                  required
                  value={newSpot.name}
                  onChange={(e) => setNewSpot({ ...newSpot, name: e.target.value })}
                  placeholder="e.g. Sir Ivan Stedeford Hospital"
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Type</label>
                  <select
                    value={newSpot.type}
                    onChange={(e) => setNewSpot({ ...newSpot, type: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  >
                    <option value="Hospital">Hospital</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Blood Bank">Blood Bank</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Ward Number</label>
                  <input
                    type="number"
                    value={newSpot.ward}
                    onChange={(e) => setNewSpot({ ...newSpot, ward: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Emergency Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newSpot.phone}
                  onChange={(e) => setNewSpot({ ...newSpot, phone: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Full Address</label>
                <input
                  type="text"
                  required
                  value={newSpot.address}
                  onChange={(e) => setNewSpot({ ...newSpot, address: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is24"
                  checked={newSpot.is24x7}
                  onChange={(e) => setNewSpot({ ...newSpot, is24x7: e.target.checked })}
                />
                <label htmlFor="is24" className="font-semibold">24x7 Emergency Services Available</label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold">
                  Add Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
