import { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Avadi City Administration Control Console",
};

export default async function AdminDashboardPage() {
  const session = await requireRole("ADMIN");
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  // Build query filters based on role
  const complaintWhere = isSuperAdmin ? {} : { incidentWard: session.wardNumber };
  const userWhere = isSuperAdmin ? {} : { wardNumber: session.wardNumber };

  // Fetch metrics in parallel
  const [complaintStats, totalUsers, recentComplaints, totalComplaints] =
    await Promise.all([
      prisma.complaint.groupBy({
        by: ["status"],
        where: complaintWhere,
        _count: { status: true },
      }),
      prisma.user.count({ where: userWhere }),
      prisma.complaint.findMany({
        where: complaintWhere,
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          issueId: true,
          title: true,
          status: true,
          category: true,
          author: true,
          incidentWard: true,
          createdAt: true,
        },
      }),
      prisma.complaint.count({ where: complaintWhere }),
    ]);

  // Status mapping
  const statusCounts: Record<string, number> = {};
  for (const s of complaintStats) {
    statusCounts[s.status] = s._count.status;
  }

  const submittedCount = statusCounts["Submitted"] ?? 0;
  const inProgressCount = statusCounts["In Progress"] ?? 0;
  const resolvedCount = statusCounts["Resolved"] ?? 0;

  return (
    <div className="space-y-8">
      {/* Horizontal Overview Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-linear-to-r from-indigo-900 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isSuperAdmin
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                }`}
              >
                <Shield size={12} />
                {session.role}
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-slate-300 text-xs flex items-center gap-1 font-medium">
                <MapPin size={12} />
                {isSuperAdmin ? "Global (All Wards)" : `Ward ${session.wardNumber}`}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome back, {session.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              {isSuperAdmin
                ? "Global monitoring active. You have full administrative governance across all 48 wards in Avadi."
                : `You are managing ward-level operations for Ward ${session.wardNumber}. All complaints and records are scoped to your assigned ward.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/complaints"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-sm"
            >
              <FileText size={15} />
              <span>Manage Complaints</span>
            </Link>

            {isSuperAdmin && (
              <Link
                href="/admin/super-admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-500 transition-colors shadow-sm"
              >
                <Shield size={15} />
                <span>Super Admin Console</span>
              </Link>
            )}
          </div>
        </div>

        {/* Ambient background accent */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Horizontal Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Complaints"
          value={totalComplaints}
          trend="+12% from last week"
          color="indigo"
        />
        <StatCard
          icon={Clock}
          label="Pending / Submitted"
          value={submittedCount}
          trend="Needs acknowledgment"
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="In Progress"
          value={inProgressCount}
          trend="Under active work"
          color="purple"
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved"
          value={resolvedCount}
          trend={`${totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0}% resolution rate`}
          color="emerald"
        />
      </div>

      {/* Main Grid: Recent Complaints + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Complaints Table (Takes 2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-base">
                Recent Citizen Complaints
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isSuperAdmin ? "Latest submissions across all wards" : `Latest submissions in Ward ${session.wardNumber}`}
              </p>
            </div>
            <Link
              href="/admin/complaints"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Issue Title</th>
                  <th className="px-6 py-3">Category</th>
                  {isSuperAdmin && <th className="px-6 py-3">Ward</th>}
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentComplaints.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {c.issueId || c.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                      {c.title}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {c.category}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        Ward {c.incidentWard}
                      </td>
                    )}
                    <td className="px-6 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right text-xs text-slate-500 dark:text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
                {recentComplaints.length === 0 && (
                  <tr>
                    <td
                      colSpan={isSuperAdmin ? 6 : 5}
                      className="px-6 py-12 text-center text-slate-400 text-sm"
                    >
                      No complaints reported yet in this scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Directory & Ward Info (Takes 1 col) */}
        <div className="space-y-6">
          {/* User Directory Overview */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {isSuperAdmin ? "Registered Citizens" : `Ward ${session.wardNumber} Citizens`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active user profiles
                  </p>
                </div>
              </div>
            </div>

            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {totalUsers}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verified resident accounts currently registered.
            </p>

            <Link
              href="/admin/users"
              className="mt-4 flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span>View User Directory</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Quick Support & Municipal Info */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
              Administrative Protocols
            </h3>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Complaints must be acknowledged within 24 hours of submission.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Resolution status requires photo or verification memo attachment.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Ward emergency broadcasts require Super Admin authorization.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  trend: string;
  color: "indigo" | "amber" | "purple" | "emerald";
}) {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-950/50",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-100 dark:border-indigo-900/40",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/50",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/40",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-950/50",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-100 dark:border-purple-900/40",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-900/40",
    },
  };

  const scheme = colorMap[color];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`p-2 rounded-xl ${scheme.bg} ${scheme.text}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
        {value}
      </div>
      <p className="text-[11px] text-slate-400 mt-1">{trend}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Submitted:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60",
    Acknowledged:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60",
    "In Progress":
      "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60",
    Resolved:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
        styles[status] ?? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}
