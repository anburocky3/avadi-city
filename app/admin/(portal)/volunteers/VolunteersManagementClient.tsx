"use client";

import React, { useState } from "react";
import {
  HelpingHand,
  Heart,
  Plus,
  Search,
  Trash2,
  Calendar,
  Users,
  MapPin,
  Phone,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { initialVolunteersData } from "@/data/volunteerSpots";
import { initialDonations } from "@/data/donations";

export function VolunteersManagementClient() {
  const [drives, setDrives] = useState(initialVolunteersData);
  const [donations, setDonations] = useState(initialDonations);
  const [activeTab, setActiveTab] = useState<"drives" | "donations">("drives");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newDrive, setNewDrive] = useState({
    title: "",
    org: "Avadi City Green Corps",
    date: "This Sunday, 7:00 AM",
    location: "Paruthipattu Lake, Avadi",
    ward: 14,
    volunteersNeeded: "25 Volunteers",
    contact: "",
    description: "",
  });

  const handleDeleteDrive = (id: string | number) => {
    if (!confirm("Remove this volunteering drive?")) return;
    setDrives((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddDrive = (e: React.FormEvent) => {
    e.preventDefault();
    const created: any = {
      id: `vol-${Date.now()}`,
      title: newDrive.title,
      org: newDrive.org,
      date: newDrive.date,
      location: newDrive.location,
      ward: Number(newDrive.ward),
      volunteersNeeded: newDrive.volunteersNeeded,
      contact: newDrive.contact,
      description: newDrive.description,
    };
    setDrives([created, ...drives]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Volunteers & Civic Causes Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Coordinate environmental tree planting drives, lake cleanups, and emergency blood requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/volunteers"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>Live Volunteer Hub</span>
            <ExternalLink size={13} />
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus size={15} />
            <span>Add Civic Initiative</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-xs font-medium w-fit">
        <button
          onClick={() => setActiveTab("drives")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
            activeTab === "drives"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <HelpingHand size={14} />
          <span>Volunteering Drives ({drives.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("donations")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
            activeTab === "donations"
              ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Heart size={14} />
          <span>Charity & Donations ({donations.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === "drives" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drives.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-xs space-y-3"
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {item.volunteersNeeded}
                </span>

                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                  {item.title}
                </h3>
                <p className="text-xs font-semibold text-indigo-600">{item.org}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>

                <div className="space-y-1 text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400" />
                    <span className="truncate">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-400" />
                    <span className="font-mono">{item.contact}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleDeleteDrive(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "donations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {donations.map((d: any) => (
            <div
              key={d.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-2"
            >
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{d.causeName}</h3>
              <p className="text-xs text-indigo-600 font-medium">Needed: {d.neededItems}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{d.description}</p>
              <p className="text-xs text-slate-400 font-mono">Contact: {d.contactPhone} · Ward {d.ward}</p>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add Volunteer Initiative</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddDrive} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Drive / Cause Title *</label>
                <input
                  type="text"
                  required
                  value={newDrive.title}
                  onChange={(e) => setNewDrive({ ...newDrive, title: e.target.value })}
                  placeholder="e.g. Paruthipattu Lake Native Tree Plantation"
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Organizing Entity</label>
                  <input
                    type="text"
                    value={newDrive.org}
                    onChange={(e) => setNewDrive({ ...newDrive, org: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Target Volunteers</label>
                  <input
                    type="text"
                    value={newDrive.volunteersNeeded}
                    onChange={(e) => setNewDrive({ ...newDrive, volunteersNeeded: e.target.value })}
                    placeholder="e.g. 50 Volunteers"
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Date & Time</label>
                  <input
                    type="text"
                    value={newDrive.date}
                    onChange={(e) => setNewDrive({ ...newDrive, date: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={newDrive.contact}
                    onChange={(e) => setNewDrive({ ...newDrive, contact: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Location / Ward</label>
                <input
                  type="text"
                  required
                  value={newDrive.location}
                  onChange={(e) => setNewDrive({ ...newDrive, location: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDrive.description}
                  onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold">
                  Publish Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
