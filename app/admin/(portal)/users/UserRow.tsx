"use client";

import React, { useState, useTransition } from "react";
import { updateUserRoleAction, deleteUserAction } from "@/app/actions/records";
import { Loader2, Trash2 } from "lucide-react";
import type { Role } from "@/types/auth";

interface UserRowProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    wardNumber: number;
    role: string;
    createdAt: Date;
  };
  isSuperAdmin: boolean;
  currentUserId: string;
}

export function UserRow({ user, isSuperAdmin, currentUserId }: UserRowProps) {
  const [isPending, startTransition] = useTransition();
  const [currentRole, setCurrentRole] = useState(user.role);
  const [isDeleted, setIsDeleted] = useState(false);
  const [saved, setSaved] = useState(false);

  const isSelf = user.id === currentUserId;

  const handleRoleChange = (newRole: Role) => {
    startTransition(async () => {
      const res = await updateUserRoleAction(user.id, newRole);
      if (res.success) {
        setCurrentRole(newRole);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(res.message || "Failed to update user role");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete user ${user.name}? This will remove all their records.`)) return;

    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      if (res.success) {
        setIsDeleted(true);
      } else {
        alert(res.message || "Failed to delete user");
      }
    });
  };

  if (isDeleted) return null;

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {user.name} {isSelf && <span className="text-[10px] text-indigo-500 font-normal">(You)</span>}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs font-mono text-slate-600 dark:text-slate-300">
        {user.phone}
      </td>
      <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-300 font-medium">
        Ward {user.wardNumber}
      </td>
      <td className="px-6 py-4">
        {isSuperAdmin && !isSelf ? (
          <div className="flex items-center gap-2">
            <select
              value={currentRole}
              disabled={isPending}
              onChange={(e) => handleRoleChange(e.target.value as Role)}
              className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
            {isPending && <Loader2 size={13} className="animate-spin text-indigo-600" />}
            {saved && <span className="text-[10px] text-emerald-600 font-medium">Updated</span>}
          </div>
        ) : (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              currentRole === "SUPER_ADMIN"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40"
                : currentRole === "ADMIN"
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {currentRole}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
        {new Date(user.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-6 py-4 text-right">
        {isSuperAdmin && !isSelf && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            title="Delete user"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        )}
      </td>
    </tr>
  );
}
