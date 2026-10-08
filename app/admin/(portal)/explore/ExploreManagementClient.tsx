"use client";

import React, { useState } from "react";
import {
  Compass,
  Plus,
  Search,
  Trash2,
  MapPin,
  Clock,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { initialPlaces } from "@/data/places";

export function ExploreManagementClient() {
  const [places, setPlaces] = useState(initialPlaces);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlace, setNewPlace] = useState({
    name: "",
    category: "Parks",
    description: "",
    address: "",
    timings: "6:00 AM - 8:00 PM",
    imageUrl: "",
  });

  const handleDelete = (id: number | string) => {
    if (!confirm("Are you sure you want to delete this place?")) return;
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = {
      id: Date.now(),
      name: newPlace.name,
      category: newPlace.category,
      description: newPlace.description,
      address: newPlace.address,
      timings: newPlace.timings,
      imageUrl: newPlace.imageUrl || "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600",
    };
    setPlaces([created, ...places]);
    setShowAddModal(false);
    setNewPlace({
      name: "",
      category: "Parks",
      description: "",
      address: "",
      timings: "6:00 AM - 8:00 PM",
      imageUrl: "",
    });
  };

  const filteredPlaces = places.filter(
    (p) =>
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Explore Places & Landmarks Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Curate civic spots, public parks, historic temples, and municipal facilities for Avadi residents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>Live Explore View</span>
            <ExternalLink size={13} />
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus size={15} />
            <span>Add Civic Spot</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search places by name, category, or area..."
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlaces.map((place) => (
          <div
            key={place.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
          >
            <div>
              <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 relative">
                {place.imageUrl ? (
                  <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Compass size={32} />
                  </div>
                )}
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-xs">
                  {place.category}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {place.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {place.description}
                </p>

                <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    <span>{place.timings}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400" />
                    <span className="truncate">{place.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600">Active Listing</span>
              <button
                onClick={() => handleDelete(place.id)}
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
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add New Place / Spot</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Place Name *</label>
                <input
                  type="text"
                  required
                  value={newPlace.name}
                  onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                  placeholder="e.g. Paruthipattu Lake Eco-Park"
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Category</label>
                <select
                  value={newPlace.category}
                  onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                >
                  <option value="Parks">Parks & Recreation</option>
                  <option value="Temples/Places of Worship">Places of Worship</option>
                  <option value="Famous Spots">Famous Spots</option>
                  <option value="Schools & Colleges">Schools & Colleges</option>
                  <option value="Government Offices">Government Offices</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Visiting Hours</label>
                <input
                  type="text"
                  value={newPlace.timings}
                  onChange={(e) => setNewPlace({ ...newPlace, timings: e.target.value })}
                  placeholder="5:00 AM - 9:00 AM, 4:00 PM - 8:30 PM"
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Full Address</label>
                <input
                  type="text"
                  required
                  value={newPlace.address}
                  onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Image URL</label>
                <input
                  type="url"
                  value={newPlace.imageUrl}
                  onChange={(e) => setNewPlace({ ...newPlace, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newPlace.description}
                  onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold">
                  Publish Spot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
