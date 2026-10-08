import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  ShieldAlert,
  Users,
  FileText,
  Building,
  TrendingUp,
  MapPin,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Super Admin Global Control",
  description: "Global Administration & Platform Operations for Avadi City Corporation",
};

export default async function SuperAdminControlPage() {
  let session;
  try {
    session = await requireRole("SUPER_ADMIN");
  } catch {
    redirect("/admin");
  }

  // Fetch comprehensive platform statistics
  const [
    totalUsers,
    totalComplaints,
    complaintsByStatus,
    complaintsByWard,
    adminUsers,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.complaint.count(),
    prisma.complaint.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.complaint.groupBy({
      by: ["incidentWard"],
      _count: { incidentWard: true },
      orderBy: { _count: { incidentWard: "desc" } },
      take: 8,
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      orderBy: { role: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        wardNumber: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wardNumber: true,
        createdAt: true,
      },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const s of complaintsByStatus) {
    statusCounts[s.status] = s._count.status;
  }

  return (
    <div className="space-y-8">
      {/* Super Admin Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
              Platform Master Console
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Super Admin Level 2 Authorization
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Global Governance & Officers Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Platform-wide metrics, municipal officer role assignments, and cross-ward analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Active Wards: </span>
            <strong className="text-slate-900 dark:text-white font-bold">48 Wards</strong>
          </div>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Citizens</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalUsers}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across all zones</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">City Complaints</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalComplaints}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total recorded</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Admin Staff</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{adminUsers.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Officers assigned</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Resolution Rate</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {totalComplaints > 0 ? Math.round(((statusCounts["Resolved"] ?? 0) / totalComplaints) * 100) : 0}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{statusCounts["Resolved"] ?? 0} resolved</p>
        </div>
      </div>

      {/* Two Column Section: Ward Volume Distribution + Appointed Officers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Complaint Distribution */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Top Wards by Incident Volume
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Identifies zones requiring additional municipal resource deployment
          </p>

          <div className="space-y-4">
            {complaintsByWard.map((w) => {
              const pct = totalComplaints > 0 ? Math.round((w._count.incidentWard / totalComplaints) * 100) : 0;
              return (
                <div key={w.incidentWard} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Ward {w.incidentWard}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {w._count.incidentWard} complaints ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-indigo-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct * 2.5 + 10, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {complaintsByWard.length === 0 && (
              <p className="text-sm text-slate-400 py-6 text-center">No ward data available.</p>
            )}
          </div>
        </div>

        {/* Administrative Officers List */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Authorized Ward Officers & Super Admins
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Accounts with privileged elevated credentials
          </p>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {adminUsers.map((officer) => (
              <div key={officer.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                    {officer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {officer.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {officer.email} · Assigned Ward {officer.wardNumber}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    officer.role === "SUPER_ADMIN"
                      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                      : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60"
                  }`}
                >
                  {officer.role === "SUPER_ADMIN" ? "Super Admin" : "Ward Admin"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Citizen Registrations Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white text-base">
            Recently Registered Citizens (Platform-Wide)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3">Citizen Name</th>
                <th className="px-6 py-3">Email Address</th>
                <th className="px-6 py-3">Ward</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                    {u.name}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                    {u.email}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                    Ward {u.wardNumber}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-xs text-slate-500 dark:text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
