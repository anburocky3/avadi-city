"use client";

import React, { useState } from "react";
import {
  Shield,
  Edit3,
  PauseCircle,
  PlayCircle,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Car,
  Heart,
  Phone,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Volunteer } from "@/types/volunteer";
import { StatusBadge } from "./StatusBadge";
import { Modal } from "@/components/shared-components";
import volunteerService from "@/services/volunteerService";
import toast from "@/utils/toast";

export interface MyVolunteerProfileProps {
  volunteer: Volunteer;
  avatarUrl?: string | null;
  onEdit: () => void;
  onStatusChange: (updated: Volunteer) => void;
  onLeave: () => void;
  onRefresh?: () => void;
}

export const MyVolunteerProfile: React.FC<MyVolunteerProfileProps> = ({
  volunteer,
  avatarUrl,
  onEdit,
  onStatusChange,
  onLeave,
  onRefresh,
}) => {
  const effectiveAvatar = avatarUrl || volunteer.avatar;
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const cleanStatus = (volunteer.status || "").trim().toLowerCase();
  const isPaused = cleanStatus === "paused";
  const isPending = cleanStatus === "pending";

  const handleTogglePause = () => {
    try {
      const updated = volunteerService.toggleStatus(volunteer.id);
      onStatusChange(updated);
      toast.success(
        updated.status === "paused"
          ? "Availability paused. You won't receive active alerts until resumed."
          : "Availability resumed! You are now active in the directory.",
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to update availability status.");
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await volunteerService.removeAsync(volunteer.id, volunteer.userId);
      toast.info("Your volunteer profile has been deleted.");
      setShowDeleteModal(false);
      onLeave();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete volunteer profile.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="p-5 md:p-6 bg-gradient-to-br from-white via-white to-orange-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/10 border border-orange-200/80 dark:border-orange-900/40 rounded-3xl shadow-sm space-y-5">
        {/* Pending Verification Notice */}
        {isPending && (
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs font-black text-amber-900 dark:text-amber-200">
                  Registration Awaiting Admin Approval in Database
                </p>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 font-medium leading-relaxed">
                  Your volunteer application has been submitted to the database with status{" "}
                  <span className="font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-200/70 dark:bg-amber-900/50 px-1 py-0.5 rounded">
                    pending
                  </span>
                  . Once an admin approves your profile in the database, your card will automatically show in the public Citizens Directory.
                </p>
              </div>
            </div>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-amber-200/70 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 text-[11px] font-bold text-amber-900 dark:text-amber-100 transition flex items-center gap-1 cursor-pointer shadow-xs"
                title="Check latest status from database"
              >
                <RefreshCw size={12} />
                <span>Refresh Status</span>
              </button>
            )}
          </div>
        )}

        {/* Header & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            {effectiveAvatar ? (
              <img
                src={effectiveAvatar}
                alt={volunteer.fullName}
                className="w-12 h-12 rounded-2xl object-cover border border-orange-200 dark:border-orange-900/50 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-primary flex items-center justify-center font-black text-lg border border-orange-200 dark:border-orange-900/50 shrink-0">
                {volunteer.fullName ? volunteer.fullName[0].toUpperCase() : "V"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-slate-800 dark:text-white leading-tight">
                  {volunteer.fullName}
                </h3>
                <StatusBadge
                  type="volunteerStatus"
                  value={volunteer.status}
                />
              </div>
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-primary" />
                Ward {volunteer.ward} · {volunteer.gender} · Age {volunteer.age}
                <span className="font-mono text-primary font-bold ml-1">
                  ({volunteer.id})
                </span>
              </p>
            </div>
          </div>

          <StatusBadge
            type="bloodGroup"
            value={volunteer.health.bloodGroup}
          />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Calendar size={11} />
              Availability
            </span>
            <p className="font-bold text-slate-700 dark:text-slate-200">
              {volunteer.availability.days.join(", ")}
            </p>
            <p className="text-[11px] text-slate-400">
              {volunteer.availability.type} ({volunteer.availability.slots.join(", ")})
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Car size={11} />
              Logistics & Travel
            </span>
            <p className="font-bold text-slate-700 dark:text-slate-200">
              {volunteer.vehicle}
            </p>
            <p className="text-[11px] text-slate-400">
              Radius: {volunteer.availability.radius}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Phone size={11} />
              Privacy & Mobile
            </span>
            <p className="font-bold text-slate-700 dark:text-slate-200">
              +91 {volunteer.contact.mobile}
            </p>
            <p className="text-[11px] text-slate-400">
              {volunteer.contact.showPhonePublic
                ? "Phone Publicly Visible"
                : "Phone Hidden (Private)"}
            </p>
          </div>
        </div>

        {/* Interests & Skills chips */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-1">
              Interests:
            </span>
            {volunteer.interests.map((i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-primary border border-orange-200/50 dark:border-orange-900/40 text-[10px] font-extrabold"
              >
                {i}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-1">
              Skills:
            </span>
            {volunteer.skills.map((s) => (
              <span
                key={s}
                className="px-2.5 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-primary border border-orange-200/50 dark:border-orange-900/40 text-[10px] font-extrabold"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Action Controls: Edit, Delete, Pause */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <button
              type="button"
              onClick={onEdit}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Edit3 size={14} className="text-primary" />
              <span>Edit Profile</span>
            </button>

            {/* Pause/Resume (Only relevant when active/paused) */}
            {!isPending && (
              <button
                type="button"
                onClick={handleTogglePause}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  isPaused
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
                }`}
              >
                {isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                <span>{isPaused ? "Resume Availability" : "Pause Availability"}</span>
              </button>
            )}
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition flex items-center gap-1.5 cursor-pointer ml-auto shadow-sm"
          >
            <Trash2 size={14} />
            <span>Delete Profile</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Volunteer Registration"
        maxWidth="sm:max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to delete your volunteer registration? This will permanently remove your profile from the database. You can re-register anytime.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={13} />
                  <span>Yes, Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MyVolunteerProfile;
