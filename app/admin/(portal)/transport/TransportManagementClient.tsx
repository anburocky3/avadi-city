"use client";

import React, { useState } from "react";
import {
  Bus,
  Train,
  Fuel,
  Plus,
  Search,
  Trash2,
  Clock,
  MapPin,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { mtcBuses, suburbanTrains, fuelStations } from "@/data/transport";

interface BusRoute {
  id: number | string;
  routeNo: string;
  from: string;
  to: string;
  stops: string;
}

interface TrainRoute {
  id: number | string;
  trainNo: string;
  route: string;
  type: string;
  time: string;
  duration: string;
  platform: string;
}

interface FuelStationItem {
  id: number | string;
  name: string;
  distance: string;
  fuelTypes: string[];
  open24x7: boolean;
  ward: number;
}

export function TransportManagementClient() {
  const [buses, setBuses] = useState<BusRoute[]>(mtcBuses as BusRoute[]);
  const [trains, setTrains] = useState<TrainRoute[]>(suburbanTrains as TrainRoute[]);
  const [fuels, setFuels] = useState<FuelStationItem[]>(fuelStations as FuelStationItem[]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"buses" | "trains" | "fuels">("buses");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newBus, setNewBus] = useState({
    routeNo: "",
    from: "Avadi",
    to: "",
    stops: "",
  });

  const handleDeleteBus = (id: number | string) => {
    if (!confirm("Remove this bus route?")) return;
    setBuses((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddBus = (e: React.FormEvent) => {
    e.preventDefault();
    const created: BusRoute = {
      id: Date.now(),
      routeNo: newBus.routeNo,
      from: newBus.from,
      to: newBus.to,
      stops: newBus.stops,
    };
    setBuses([created, ...buses]);
    setShowAddModal(false);
    setNewBus({
      routeNo: "",
      from: "Avadi",
      to: "",
      stops: "",
    });
  };

  const filteredBuses = buses.filter(
    (b: BusRoute) =>
      searchQuery === "" ||
      b.routeNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.stops.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Travel & Transport Infrastructure
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage MTC Bus timetables, Suburban Railway schedules, and verified fuel stations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/transport"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>Live Transport Portal</span>
            <ExternalLink size={13} />
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus size={15} />
            <span>Add MTC Route</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("buses")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              activeTab === "buses"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Bus size={14} />
            <span>MTC Buses ({buses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("trains")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              activeTab === "trains"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Train size={14} />
            <span>Suburban Trains ({trains.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("fuels")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              activeTab === "fuels"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Fuel size={14} />
            <span>Fuel Stations ({fuels.length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search route, destination, stop..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === "buses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBuses.map((bus: BusRoute) => (
            <div
              key={bus.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-xs space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg">
                    {bus.routeNo}
                  </span>
                  <span className="text-[11px] text-slate-500">MTC Regular</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                  {bus.from} ➔ {bus.to}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Stops: {bus.stops}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleDeleteBus(bus.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "trains" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trains.map((train: TrainRoute) => (
            <div
              key={train.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {train.route}
                </span>
                <span className="text-xs text-indigo-600 font-semibold font-mono">Platform {train.platform}</span>
              </div>
              <p className="text-xs text-slate-500">Train No: {train.trainNo} · Departure: {train.time} · Duration: {train.duration}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {train.type} Suburban Service
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "fuels" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fuels.map((fuel: FuelStationItem) => (
            <div
              key={fuel.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-2"
            >
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{fuel.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin size={12} />
                Ward {fuel.ward} · {fuel.distance}
              </p>
              <div className="flex items-center gap-1">
                {fuel.fuelTypes.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add MTC Bus Route</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddBus} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Route Number *</label>
                <input
                  type="text"
                  required
                  value={newBus.routeNo}
                  onChange={(e) => setNewBus({ ...newBus, routeNo: e.target.value })}
                  placeholder="e.g. 70A"
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">From</label>
                  <input
                    type="text"
                    value={newBus.from}
                    onChange={(e) => setNewBus({ ...newBus, from: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">To Destination</label>
                  <input
                    type="text"
                    required
                    value={newBus.to}
                    onChange={(e) => setNewBus({ ...newBus, to: e.target.value })}
                    placeholder="e.g. Tambaram"
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Via Major Stops</label>
                <input
                  type="text"
                  value={newBus.stops}
                  onChange={(e) => setNewBus({ ...newBus, stops: e.target.value })}
                  placeholder="Ambattur, Koyambedu, Guindy"
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold">
                  Add Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
