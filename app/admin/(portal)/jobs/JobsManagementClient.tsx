"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Trash2,
  MapPin,
  Clock,
  Phone,
  DollarSign,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { initialJobsData } from "@/data/jobSpots";

export function JobsManagementClient() {
  const [jobs, setJobs] = useState(initialJobsData);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJob, setNewJob] = useState({
    role: "",
    businessName: "",
    jobType: "Full-Time",
    salary: "₹15,000 / month",
    location: "Avadi, Chennai",
    shift: "9:00 AM - 6:00 PM",
    contact: "",
    ward: 14,
    details: "",
  });

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to remove this job vacancy?")) return;
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = {
      id: `job-${Date.now()}`,
      role: newJob.role,
      businessName: newJob.businessName,
      jobType: newJob.jobType,
      postedTime: "Just now",
      salary: newJob.salary,
      location: newJob.location,
      shift: newJob.shift,
      contact: newJob.contact,
      ward: Number(newJob.ward),
      details: newJob.details,
      requirements: [newJob.details || "Basic skills required"],
    };
    setJobs([created, ...jobs]);
    setShowAddModal(false);
    setNewJob({
      role: "",
      businessName: "",
      jobType: "Full-Time",
      salary: "₹15,000 / month",
      location: "Avadi, Chennai",
      shift: "9:00 AM - 6:00 PM",
      contact: "",
      ward: 14,
      details: "",
    });
  };

  const filteredJobs = jobs.filter(
    (j) =>
      searchQuery === "" ||
      j.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.location || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Local Job Vacancies Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage employment postings and opportunities across Avadi commercial establishments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>Live Job Portal</span>
            <ExternalLink size={13} />
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus size={15} />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search job title, shop name, location..."
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-xs space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {job.jobType}
                </span>
                <span className="text-[11px] text-slate-400">{job.postedTime}</span>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                {job.role}
              </h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {job.businessName}
              </p>

              <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={13} className="text-emerald-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{job.salary}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-slate-400" />
                  <span>{job.shift}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400" />
                  <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" />
                  <span className="font-mono">{job.contact}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600">Active</span>
              <button
                onClick={() => handleDelete(job.id)}
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
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Post New Job Vacancy</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Job Role / Title *</label>
                <input
                  type="text"
                  required
                  value={newJob.role}
                  onChange={(e) => setNewJob({ ...newJob, role: e.target.value })}
                  placeholder="e.g. Counter Cashier & Billing Staff"
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={newJob.businessName}
                  onChange={(e) => setNewJob({ ...newJob, businessName: e.target.value })}
                  placeholder="e.g. Sri Balaji Supermarket"
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Job Type</label>
                  <select
                    value={newJob.jobType}
                    onChange={(e) => setNewJob({ ...newJob, jobType: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newJob.contact}
                    onChange={(e) => setNewJob({ ...newJob, contact: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Shift Timings</label>
                  <input
                    type="text"
                    value={newJob.shift}
                    onChange={(e) => setNewJob({ ...newJob, shift: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Location / Ward</label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold">
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
