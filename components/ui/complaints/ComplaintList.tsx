"use client";

import React, { useState, useEffect, useMemo, MouseEvent } from "react";
import { motion } from "framer-motion";
import { MapPin, ThumbsUp, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge, Modal, EmptyState } from "@/components/shared-components";
import { Complaint, useWard } from "@/context/wardContext";
import { useRouter } from "next/navigation";
import { reverseGeocodeAvadi } from "@/lib/wards";

export default function ComplaintList({
  data,
  emptyMessage,
}: {
  data: Complaint[];
  emptyMessage: string;
}) {
  const router = useRouter();
  const { upvoteComplaint } = useWard();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [upvotingId, setUpvotingId] = useState<number | string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedComplaint) {
      setResolvedAddress(null);
      return;
    }
    const addr = selectedComplaint.address;
    if (
      addr &&
      addr.trim() !== "" &&
      addr !== "Selected Location" &&
      addr !== "Selected Location...."
    ) {
      setResolvedAddress(addr);
      return;
    }

    // If coordinates are available, reverse geocode to fetch real address
    if (selectedComplaint.lat && selectedComplaint.lng) {
      reverseGeocodeAvadi(selectedComplaint.lat, selectedComplaint.lng)
        .then((res) => {
          if (res.address || res.streetName) {
            setResolvedAddress(res.address || res.streetName);
          } else {
            setResolvedAddress("Location not available");
          }
        })
        .catch(() => {
          setResolvedAddress("Location not available");
        });
    } else {
      setResolvedAddress("Location not available");
    }
  }, [selectedComplaint]);

  const displayAddress =
    resolvedAddress ||
    (selectedComplaint?.address &&
    selectedComplaint.address !== "Selected Location" &&
    selectedComplaint.address !== "Selected Location...."
      ? selectedComplaint.address
      : "Location not available");

  const cleanDescription = useMemo(() => {
    if (!selectedComplaint?.description) return "";
    let desc = selectedComplaint.description;
    const addr =
      displayAddress !== "Location not available"
        ? displayAddress
        : selectedComplaint.address &&
            selectedComplaint.address !== "Selected Location"
          ? selectedComplaint.address
          : `Ward ${selectedComplaint.ward || selectedComplaint.incidentWard || 14}, Avadi`;

    return desc.replace(
      /Location:\s*Selected Location(?:\.\.\.|\.)?/gi,
      `Location: ${addr}.`,
    );
  }, [selectedComplaint, displayAddress]);

  const handleUpvote = (
    id: number | string,
    e: MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    setUpvotingId(id);
    upvoteComplaint(id);
    setTimeout(() => setUpvotingId(null), 500);
  };

  const uniqueComplaints = React.useMemo(() => {
    const seen = new Set<string>();
    return data.filter((c) => {
      const idStr = String(c.id);
      if (seen.has(idStr)) return false;
      seen.add(idStr);
      return true;
    });
  }, [data]);

  if (uniqueComplaints.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No complaints found"
        description={emptyMessage}
        actionText="File New Issue"
        onAction={() => router.push("/complaints/report")}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {uniqueComplaints.map((complaint) => {
          // Add your categoryConfig fallback here or pass it in as a prop
          const formattedIssueId =
            complaint.issueId || `AVD-2026-${1000 + Number(complaint.id)}`;

          const cardAddress =
            complaint.address &&
            complaint.address !== "Selected Location" &&
            complaint.address !== "Selected Location...."
              ? complaint.address
              : `Ward ${complaint.ward || complaint.incidentWard || complaint.userWard || 14}, Avadi`;

          const cleanCardDescription = complaint.description
            ? complaint.description.replace(
                /Location:\s*Selected Location(?:\.\.\.|\.)?/gi,
                `Location: ${cardAddress}.`,
              )
            : "";

          return (
            <motion.div
              key={complaint.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedComplaint(complaint)}
              className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-primary hover:shadow-md transition cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                        {formattedIssueId}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Ward {complaint.ward || complaint.incidentWard || 14} ·{" "}
                        {complaint.subCategory || complaint.category}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      {complaint.title}
                    </h3>
                  </div>
                </div>
                <Badge
                  variant="warning"
                  className="shrink-0 font-extrabold text-xs"
                >
                  {complaint.status}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 pl-1">
                {cleanCardDescription}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-slate-500">
                <button
                  onClick={(e) => handleUpvote(complaint.id, e)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 hover:text-orange-500 transition cursor-pointer text-xs font-extrabold active:scale-95"
                >
                  <ThumbsUp
                    size={14}
                    className={
                      upvotingId === complaint.id
                        ? "animate-bounce text-orange-500"
                        : ""
                    }
                  />
                  <span>{complaint.upvotes} Upvotes</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* DETAILED GRIEVANCE VIEW MODAL */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title="Track Grievance"
        >
          <div className="space-y-5">
            <div className="flex items-start space-x-4">
              <img
                src={selectedComplaint.imageUrl}
                alt={selectedComplaint.title}
                className="w-24 h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                    {selectedComplaint.issueId ||
                      `AVD-2026-${1000 + Number(selectedComplaint.id)}`}
                  </span>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Ward {selectedComplaint.ward || selectedComplaint.incidentWard || 14}
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                  {selectedComplaint.title}
                </h3>
                <p className="text-xs font-medium text-slate-500 flex items-center pt-1">
                  <MapPin size={12} className="mr-1 text-primary shrink-0" />
                  <span className="truncate">
                    {displayAddress}
                  </span>
                </p>
              </div>
            </div>

            {/* Stepper logic preserved */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-5 border border-slate-200/80 dark:border-slate-800 rounded-3xl">
              <h4 className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-5">
                Resolution Stepper Tracker
              </h4>
              <div className="flex items-center justify-between relative px-2">
                {["Submitted", "Acknowledged", "In Progress", "Resolved"].map(
                  (stage, idx) => {
                    const currentStageIdx = [
                      "Submitted",
                      "Acknowledged",
                      "In Progress",
                      "Resolved",
                    ].indexOf(selectedComplaint.status);
                    const isCompleted =
                      idx <= (currentStageIdx === -1 ? 0 : currentStageIdx);
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <div
                        key={stage}
                        className="flex flex-col items-center relative z-10"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${isCompleted ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-slate-200 dark:bg-slate-800 text-slate-400"} ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}
                        >
                          {isCompleted ? <Check size={16} /> : idx + 1}
                        </div>
                        <span
                          className={`text-xs font-extrabold mt-2 text-center ${isCurrent ? "text-primary font-black" : isCompleted ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}`}
                        >
                          {stage}
                        </span>
                      </div>
                    );
                  },
                )}
                <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
              </div>
            </div>

            {/* Dedicated Location Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Location
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <MapPin size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {displayAddress}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ward {selectedComplaint.ward || selectedComplaint.incidentWard || selectedComplaint.userWard || 14} • Avadi Corporation
                    </p>
                  </div>
                </div>
                {selectedComplaint.lat && selectedComplaint.lng ? (
                  <a
                    href={`https://www.google.com/maps?q=${selectedComplaint.lat},${selectedComplaint.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-orange-500/10 hover:text-primary text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors shrink-0 flex items-center gap-1 border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    <span>View Map</span>
                    <ExternalLink size={12} />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Issue Description
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 whitespace-pre-wrap">
                {cleanDescription}
              </p>
            </div>

            <button
              onClick={() => setSelectedComplaint(null)}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
