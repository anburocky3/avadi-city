"use client";

import React, { useState, useTransition } from "react";
import {
  approveRentalListingAction,
  deleteRentalListingAction,
  createRentalListingAdminAction,
} from "@/app/actions/adminActions";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  Search,
  Home,
  MapPin,
  Phone,
  Tag,
  DollarSign,
  ExternalLink,
  AlertCircle,
  Building,
  Key,
} from "lucide-react";
import Link from "next/link";

interface RentalItem {
  id: string;
  title: string;
  type: string;
  propertyTypeTag?: string | null;
  rent: number;
  advance: number;
  contact: string;
  ownerName?: string | null;
  location?: string | null;
  ward: number;
  imageUrl?: string | null;
  details: string;
  features?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date | string;
}

interface RentalsManagementClientProps {
  initialRentals: RentalItem[];
  currentWard: number;
  isSuperAdmin: boolean;
}

export function RentalsManagementClient({
  initialRentals,
  currentWard,
  isSuperAdmin,
}: RentalsManagementClientProps) {
  const [rentals, setRentals] = useState<RentalItem[]>(initialRentals);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newRental, setNewRental] = useState({
    title: "",
    type: "Residential",
    propertyTypeTag: "2BHK",
    rent: 12000,
    advance: 60000,
    contact: "",
    ownerName: "",
    location: "",
    ward: currentWard || 14,
    imageUrl: "",
    details: "",
  });

  const showToast = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleApprove = (id: string, title: string) => {
    startTransition(async () => {
      const res = await approveRentalListingAction(id, "APPROVED");
      if (res.success) {
        setRentals((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "APPROVED" } : item))
        );
        showToast("success", `Listing "${title}" approved!`);
      } else {
        showToast("error", res.message || "Failed to approve rental");
      }
    });
  };

  const handleReject = (id: string, title: string) => {
    startTransition(async () => {
      const res = await approveRentalListingAction(id, "REJECTED");
      if (res.success) {
        setRentals((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "REJECTED" } : item))
        );
        showToast("success", `Listing "${title}" rejected.`);
      } else {
        showToast("error", res.message || "Failed to reject rental");
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

    startTransition(async () => {
      const res = await deleteRentalListingAction(id);
      if (res.success) {
        setRentals((prev) => prev.filter((item) => item.id !== id));
        showToast("success", `"${title}" deleted successfully.`);
      } else {
        showToast("error", res.message || "Failed to delete listing");
      }
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createRentalListingAdminAction({
        ...newRental,
        ward: Number(newRental.ward),
      });

      if (res.success) {
        if (res.data) {
          setRentals((prev) => [res.data, ...prev]);
        }
        setShowAddModal(false);
        showToast("success", `Rental listing "${newRental.title}" added successfully!`);
      } else {
        showToast("error", res.message || "Failed to create rental");
      }
    });
  };

  const filteredRentals = rentals.filter((item) => {
    const matchesTab = activeTab === "ALL" ? true : item.status === activeTab;
    const matchesQuery =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(item.ward).includes(searchQuery);

    return matchesTab && matchesQuery;
  });

  const pendingCount = rentals.filter((i) => i.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm ${
            message.type === "success"
              ? "bg-emerald-900/90 text-emerald-100 border-emerald-700/60"
              : "bg-rose-900/90 text-rose-100 border-rose-700/60"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Rent & Properties Management
            </h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                {pendingCount} Pending Approval
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review, verify, and approve houses, flats, and commercial properties submitted for rent.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/rentals"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Live Property Portal</span>
            <ExternalLink size={13} />
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={15} />
            <span>Add Property Listing</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "ALL"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>All ({rentals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "PENDING"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "APPROVED"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>Approved ({rentals.filter((i) => i.status === "APPROVED").length})</span>
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "REJECTED"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>Rejected ({rentals.filter((i) => i.status === "REJECTED").length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search property, ward, type..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredRentals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <Home size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No property listings found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click &quot;Add Property Listing&quot; to register properties directly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRentals.map((prop) => (
            <div
              key={prop.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800">
                  {prop.imageUrl ? (
                    <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Home size={32} />
                    </div>
                  )}

                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      prop.status === "APPROVED"
                        ? "bg-emerald-500 text-white"
                        : prop.status === "REJECTED"
                        ? "bg-rose-500 text-white"
                        : "bg-amber-500 text-white animate-pulse"
                    }`}
                  >
                    {prop.status}
                  </span>

                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 text-white flex items-center gap-1">
                    <MapPin size={10} />
                    Ward {prop.ward}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {prop.title}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                        {prop.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {prop.details}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Monthly Rent</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                        ₹{prop.rent.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Advance</span>
                      <strong className="text-slate-700 dark:text-slate-200 font-mono text-xs">
                        ₹{prop.advance.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span className="font-mono">{prop.contact}</span>
                      {prop.ownerName && <span>({prop.ownerName})</span>}
                    </div>
                    {prop.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="truncate">{prop.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {prop.status !== "APPROVED" && (
                    <button
                      onClick={() => handleApprove(prop.id, prop.title)}
                      disabled={isPending}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      <CheckCircle size={13} />
                      <span>Approve</span>
                    </button>
                  )}
                  {prop.status !== "REJECTED" && (
                    <button
                      onClick={() => handleReject(prop.id, prop.title)}
                      disabled={isPending}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    >
                      <XCircle size={13} />
                      <span>Reject</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(prop.id, prop.title)}
                  disabled={isPending}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Rental Property
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Property Title *</label>
                <input
                  type="text"
                  required
                  value={newRental.title}
                  onChange={(e) => setNewRental({ ...newRental, title: e.target.value })}
                  placeholder="e.g. 2BHK Independent House with Parking"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Type *</label>
                  <select
                    value={newRental.type}
                    onChange={(e) => setNewRental({ ...newRental, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Ward *</label>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    required
                    value={newRental.ward}
                    onChange={(e) => setNewRental({ ...newRental, ward: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newRental.rent}
                    onChange={(e) => setNewRental({ ...newRental, rent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Advance Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newRental.advance}
                    onChange={(e) => setNewRental({ ...newRental, advance: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newRental.contact}
                    onChange={(e) => setNewRental({ ...newRental, contact: e.target.value })}
                    placeholder="e.g. 9840123456"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={newRental.ownerName}
                    onChange={(e) => setNewRental({ ...newRental, ownerName: e.target.value })}
                    placeholder="e.g. K. Sundaram"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Details & Amenities *</label>
                <textarea
                  rows={2}
                  required
                  value={newRental.details}
                  onChange={(e) => setNewRental({ ...newRental, details: e.target.value })}
                  placeholder="24/7 borewell water, covered car parking, 3-phase EB meter..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
