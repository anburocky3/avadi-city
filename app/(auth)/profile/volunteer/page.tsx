"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import { useWard } from "@/context/wardContext";
import volunteerService from "@/services/volunteerService";
import { Volunteer } from "@/types/volunteer";
import { VolunteerWizard } from "@/components/volunteer/VolunteerWizard";
import { MyVolunteerProfile } from "@/components/volunteer/MyVolunteerProfile";
import { Card } from "@/components/shared-components";
import toast from "@/utils/toast";

export default function VolunteerProfilePage() {
  const router = useRouter();
  const { authUser, activeWard } = useWard();

  const [volunteerRecord, setVolunteerRecord] = useState<Volunteer | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadProfile = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      await volunteerService.syncWithDb();
      const record = volunteerService.getMyVolunteer(
        authUser?.id,
        authUser?.phone,
        authUser?.name,
      );
      setVolunteerRecord(record);
      if (silent) {
        const s = (record?.status || "").trim().toLowerCase();
        if (s === "active" || s === "approved") {
          toast.success("Profile status: Active Force in database!");
        } else {
          toast.info("Status refreshed: Still awaiting admin approval.");
        }
      }
    } catch (err) {
      console.error("Failed to load volunteer record:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync volunteer profile on mount and on window focus
  useEffect(() => {
    loadProfile();

    const handleFocus = () => {
      loadProfile(false);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [authUser?.id, authUser?.phone, authUser?.name]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Breadcrumb Navigation & Title Header (Shown only when viewing profile card) */}
        {volunteerRecord && !isEditing && (
          <>
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition group py-1.5 px-2.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ArrowLeft
                  size={15}
                  className="group-hover:-translate-x-0.5 transition"
                />
                <span>Back to Profile</span>
              </Link>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-orange-50 dark:bg-orange-950/40 text-primary border border-orange-200/60 dark:border-orange-900/50">
                <ShieldCheck size={12} className="text-primary" />
                <span>Avadi City Force</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none flex items-center gap-2.5">
                  <HeartHandshake className="text-primary shrink-0" size={26} />
                  <span>My Volunteer Identity</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                  Your official Avadi Citizen Volunteer Force credentials and civic status.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <Card className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">
              Loading your volunteer profile...
            </p>
          </Card>
        ) : volunteerRecord && !isEditing ? (
          /* View Volunteer Profile Card */
          <Card className="p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <MyVolunteerProfile
              volunteer={volunteerRecord}
              avatarUrl={authUser?.avatar || (volunteerRecord as any)?.avatar}
              onRefresh={() => loadProfile(true)}
              onEdit={() => setIsEditing(true)}
              onStatusChange={(updated) => {
                setVolunteerRecord(updated);
                toast.success("Volunteer status updated!");
              }}
              onLeave={() => {
                setVolunteerRecord(null);
                setIsEditing(false);
                router.push("/profile");
              }}
            />
          </Card>
        ) : (
          /* Registration / Edit Wizard */
          <VolunteerWizard
            authUser={authUser}
            activeWardId={activeWard?.id}
            initialData={isEditing ? volunteerRecord : null}
            onComplete={(volunteer) => {
              setVolunteerRecord(volunteer);
              setIsEditing(false);
              toast.success(
                isEditing
                  ? "Volunteer details updated successfully!"
                  : "Welcome to the Avadi Citizen Volunteer Force!",
              );
            }}
            onCancel={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                router.push("/profile");
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
