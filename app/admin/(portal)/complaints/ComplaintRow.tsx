"use client";

import React, { useState, useTransition } from "react";
import { updateRecordStatusAction, deleteRecordAction } from "@/app/actions/records";
import { Loader2, Trash2, CheckCircle2 } from "lucide-react";

interface ComplaintRowProps {
  complaint: {
    id: string;
    issueId: string | null;
    title: string;
    category: string;
    status: string;
    author: string;
    incidentWard: number;
    createdAt: Date;
  };
  isSuperAdmin: boolean;
}

export function ComplaintRow({ complaint, isSuperAdmin }: ComplaintRowProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(complaint.status);
  const [isDeleted, setIsDeleted] = useState(false);
  const [notification, setNotification] = useState("");

  const handleStatusChange = (newStatus: any) => {
    startTransition(async () => {
      const res = await updateRecordStatusAction(complaint.id, newStatus);
      if (res.success) {
        setCurrentStatus(newStatus);
        setNotification("Status updated");
        setTimeout(() => setNotification(""), 3000);
      } else {
        alert(res.message || "Failed to update status");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete "${complaint.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteRecordAction(complaint.id);
      if (res.success) {
        setIsDeleted(true);
      } else {
        alert(res.message || "Failed to delete complaint");
      }
    });
  };

  if (isDeleted) return null;

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
      <td className="px-6 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
        {complaint.issueId || complaint.id.slice(0, 8)}
      </td>
      <td className="px-6 py-4">
        <p className="font-medium text-slate-900 dark:text-white max-w-sm">
          {complaint.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Reported by: {complaint.author}
        </p>
      </td>
      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
          {complaint.category}
        </span>
      </td>
      {isSuperAdmin && (
        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
          Ward {complaint.incidentWard}
        </td>
      )}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <select
            value={currentStatus}
            disabled={isPending}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
          >
            <option value="Submitted">Submitted</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {isPending && <Loader2 size={13} className="animate-spin text-indigo-600" />}
          {notification && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Saved
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
        {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={handleDelete}
          disabled={isPending}
          title="Delete complaint"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
