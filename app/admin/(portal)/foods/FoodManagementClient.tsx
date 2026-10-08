"use client";

import React, { useState, useTransition } from "react";
import {
  approveFoodListingAction,
  deleteFoodListingAction,
  createFoodListingAdminAction,
} from "@/app/actions/adminActions";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  Search,
  Filter,
  UtensilsCrossed,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  AlertCircle,
  Loader2,
  BadgeAlert,
  Info,
} from "lucide-react";
import Link from "next/link";

interface FoodListingItem {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  ward: number;
  phone: string;
  imageUrl: string | null;
  openingTime: string | null;
  closingTime: string | null;
  foodType: string | null;
  priceRange: string | null;
  status: string;
  createdAt: Date | string;
  user?: {
    name: string;
    email: string;
  } | null;
}

interface FoodManagementClientProps {
  initialListings: FoodListingItem[];
  currentWard: number;
  isSuperAdmin: boolean;
}

export function FoodManagementClient({
  initialListings,
  currentWard,
  isSuperAdmin,
}: FoodManagementClientProps) {
  const [listings, setListings] = useState<FoodListingItem[]>(initialListings);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New restaurant modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShop, setNewShop] = useState({
    name: "",
    category: "Restaurant",
    description: "",
    address: "",
    ward: currentWard || 14,
    phone: "",
    imageUrl: "",
    openingTime: "08:00 AM",
    closingTime: "10:30 PM",
    foodType: "Both Veg & Non-Veg",
    priceRange: "Moderate (₹₹)",
  });

  const showToast = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleApprove = (id: string, name: string) => {
    startTransition(async () => {
      const res = await approveFoodListingAction(id, "APPROVED");
      if (res.success) {
        setListings((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "APPROVED" } : item))
        );
        showToast("success", `"${name}" approved! It is now live on the public resident portal.`);
      } else {
        showToast("error", res.message || "Failed to approve listing");
      }
    });
  };

  const handleReject = (id: string, name: string) => {
    startTransition(async () => {
      const res = await approveFoodListingAction(id, "REJECTED");
      if (res.success) {
        setListings((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "REJECTED" } : item))
        );
        showToast("success", `"${name}" rejected.`);
      } else {
        showToast("error", res.message || "Failed to reject listing");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteFoodListingAction(id);
      if (res.success) {
        setListings((prev) => prev.filter((item) => item.id !== id));
        showToast("success", `"${name}" deleted successfully.`);
      } else {
        showToast("error", res.message || "Failed to delete listing");
      }
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createFoodListingAdminAction({
        ...newShop,
        ward: Number(newShop.ward),
        status: "APPROVED",
      });

      if (res.success) {
        if (res.data) {
          setListings((prev) => [res.data, ...prev]);
        }
        setShowAddModal(false);
        showToast("success", `Restaurant "${newShop.name}" created and approved!`);
        setNewShop({
          name: "",
          category: "Restaurant",
          description: "",
          address: "",
          ward: currentWard || 14,
          phone: "",
          imageUrl: "",
          openingTime: "08:00 AM",
          closingTime: "10:30 PM",
          foodType: "Both Veg & Non-Veg",
          priceRange: "Moderate (₹₹)",
        });
      } else {
        showToast("error", res.message || "Failed to create restaurant");
      }
    });
  };

  const filteredListings = listings.filter((item) => {
    const matchesTab = activeTab === "ALL" ? true : item.status === activeTab;
    const matchesQuery =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.ward).includes(searchQuery);

    return matchesTab && matchesQuery;
  });

  const pendingCount = listings.filter((i) => i.status === "PENDING").length;
  const approvedCount = listings.filter((i) => i.status === "APPROVED").length;
  const rejectedCount = listings.filter((i) => i.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            message.type === "success"
              ? "bg-emerald-900/90 text-emerald-100 border-emerald-700/60"
              : "bg-rose-900/90 text-rose-100 border-rose-700/60"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Food & Dining Moderation
            </h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                {pendingCount} Pending Approval
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review citizen-submitted restaurants. Only approved restaurants are publicly visible on{" "}
            <Link href="/foods" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline">
              /foods
            </Link>
            .
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/foods"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Live Public Portal</span>
            <ExternalLink size={13} />
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={15} />
            <span>Add Restaurant Directly</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "PENDING"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Pending Approvals</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                pendingCount > 0 ? "bg-amber-100 text-amber-800 font-bold" : "bg-slate-200 text-slate-600"
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "APPROVED"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Live & Approved</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "REJECTED"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Rejected</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {rejectedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "ALL"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>All ({listings.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by restaurant, ward, cuisine..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Listings */}
      {filteredListings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <UtensilsCrossed size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No food listings found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {activeTab === "PENDING"
              ? "All submitted food businesses have been reviewed! There are no pending approvals."
              : "No records match the current filter or search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((shop) => {
            const isShopPending = shop.status === "PENDING";
            const isShopApproved = shop.status === "APPROVED";

            return (
              <div
                key={shop.id}
                className={`flex flex-col justify-between rounded-2xl border transition-all overflow-hidden bg-white dark:bg-slate-900 shadow-xs hover:shadow-md ${
                  isShopPending
                    ? "border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-400/20"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  {/* Image Banner */}
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {shop.imageUrl ? (
                      <img
                        src={shop.imageUrl}
                        alt={shop.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <UtensilsCrossed size={32} />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                          shop.status === "APPROVED"
                            ? "bg-emerald-500 text-white"
                            : shop.status === "REJECTED"
                            ? "bg-rose-500 text-white"
                            : "bg-amber-500 text-white animate-pulse"
                        }`}
                      >
                        {shop.status}
                      </span>
                    </div>

                    {/* Ward Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white flex items-center gap-1">
                        <MapPin size={10} />
                        Ward {shop.ward}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                          {shop.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md shrink-0">
                          {shop.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {shop.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{shop.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span className="font-mono">{shop.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span>
                          {shop.openingTime || "8:00 AM"} – {shop.closingTime || "10:00 PM"}
                        </span>
                      </div>
                    </div>

                    {/* Submitter Info */}
                    {shop.user && (
                      <div className="text-[11px] bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-slate-500 dark:text-slate-400">
                        Submitted by: <strong className="text-slate-700 dark:text-slate-200">{shop.user.name}</strong> ({shop.user.email})
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls: APPROVE, REJECT, DELETE */}
                <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {shop.status !== "APPROVED" && (
                      <button
                        onClick={() => handleApprove(shop.id, shop.name)}
                        disabled={isPending}
                        title="Approve and make visible on resident app"
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle size={13} />
                        <span>Approve</span>
                      </button>
                    )}

                    {shop.status !== "REJECTED" && (
                      <button
                        onClick={() => handleReject(shop.id, shop.name)}
                        disabled={isPending}
                        title="Reject submission"
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(shop.id, shop.name)}
                    disabled={isPending}
                    title="Delete record permanently"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Restaurant to Food Directory
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Restaurant / Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={newShop.name}
                  onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                  placeholder="e.g. Sangeetha Vegetarian Restaurant"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newShop.category}
                    onChange={(e) => setNewShop({ ...newShop, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Bakery & Sweets">Bakery & Sweets</option>
                    <option value="Cafe & Tea">Cafe & Tea</option>
                    <option value="Mess / Tiffin">Mess / Tiffin</option>
                    <option value="Juice & Shake">Juice & Shake</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Avadi Ward (1-48) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    required
                    value={newShop.ward}
                    onChange={(e) => setNewShop({ ...newShop, ward: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newShop.phone}
                  onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                  placeholder="e.g. 9840112233"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Street Address & Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={newShop.address}
                  onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                  placeholder="e.g. No. 45, CTH Road, Near Checkpost, Avadi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={newShop.imageUrl}
                  onChange={(e) => setNewShop({ ...newShop, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newShop.description}
                  onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
                  placeholder="Special South Indian meals, fresh juices, and dinner tiffin..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  <span>Save & Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
