"use client";

import React, { useState, useTransition } from "react";
import {
  updateSupportStatusAction,
  deleteSupportSubmissionAction,
} from "@/app/actions/adminActions";
import {
  LifeBuoy,
  CheckCircle,
  Clock,
  Trash2,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

interface SupportItem {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  category: "technical" | "collaboration" | "feedback" | "civic_issue";
  wardNumber: number | null;
  message: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  createdAt: Date | string;
}

interface SupportManagementClientProps {
  initialSubmissions: SupportItem[];
}

export function SupportManagementClient({
  initialSubmissions,
}: SupportManagementClientProps) {
  const [submissions, setSubmissions] = useState<SupportItem[]>(initialSubmissions);
  const [activeTab, setActiveTab] = useState<"ALL" | "pending" | "in_progress" | "resolved" | "closed">("pending");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusChange = (id: number, newStatus: "pending" | "in_progress" | "resolved" | "closed") => {
    startTransition(async () => {
      const res = await updateSupportStatusAction(id, newStatus);
      if (res.success) {
        setSubmissions((prev) =>
          prev.map((sub) => (sub.id === id ? { ...sub, status: newStatus } : sub))
        );
        showToast("success", `Ticket #${id} updated to ${newStatus}.`);
      } else {
        showToast("error", res.message || "Failed to update ticket status");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm(`Are you sure you want to delete Ticket #${id}?`)) return;

    startTransition(async () => {
      const res = await deleteSupportSubmissionAction(id);
      if (res.success) {
        setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
        showToast("success", `Ticket #${id} removed successfully.`);
      } else {
        showToast("error", res.message || "Failed to delete ticket");
      }
    });
  };

  const filteredSubmissions = submissions.filter((item) => {
    const matchesTab = activeTab === "ALL" ? true : item.status === activeTab;
    const matchesCategory = selectedCategory === "ALL" ? true : item.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.id).includes(searchQuery);

    return matchesTab && matchesCategory && matchesSearch;
  });

  const pendingCount = submissions.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm ${
            toast.type === "success"
              ? "bg-emerald-900/90 text-emerald-100 border-emerald-700/60"
              : "bg-rose-900/90 text-rose-100 border-rose-700/60"
          }`}
        >
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Citizen Support & Helpdesk
            </h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                {pendingCount} Pending Tickets
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage inquiries, feedback, collaboration requests, and municipal assistance tickets.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "pending"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("in_progress")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "in_progress"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>In Progress ({submissions.filter((i) => i.status === "in_progress").length})</span>
          </button>
          <button
            onClick={() => setActiveTab("resolved")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "resolved"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>Resolved ({submissions.filter((i) => i.status === "resolved").length})</span>
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>All ({submissions.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Categories</option>
            <option value="technical">Technical</option>
            <option value="collaboration">Collaboration</option>
            <option value="feedback">Feedback</option>
            <option value="civic_issue">Civic Issue</option>
          </select>

          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resident, email, message..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <LifeBuoy size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No support inquiries found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            There are no citizen tickets under this category or status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                    Ticket #{ticket.id}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {ticket.fullName}
                  </h3>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {ticket.category.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={ticket.status}
                    onChange={(e) =>
                      handleStatusChange(
                        ticket.id,
                        e.target.value as "pending" | "in_progress" | "resolved" | "closed"
                      )
                    }
                    disabled={isPending}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                      ticket.status === "resolved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                        : ticket.status === "in_progress"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800"
                        : ticket.status === "closed"
                        ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <button
                    onClick={() => handleDelete(ticket.id)}
                    disabled={isPending}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {ticket.message}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  <a href={`mailto:${ticket.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    {ticket.email}
                  </a>
                </div>
                {ticket.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" />
                    <span className="font-mono">{ticket.phone}</span>
                  </div>
                )}
                {ticket.wardNumber && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>Ward {ticket.wardNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 ml-auto">
                  <Calendar size={12} />
                  <span>Submitted {new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
