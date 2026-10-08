import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ComplaintRow } from "./ComplaintRow";
import { FileText, Filter, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Complaints Management",
  description: "Citizen complaints and grievances control panel",
};

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireRole("ADMIN");
  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const params = await searchParams;
  const statusFilter = params.status;

  const whereClause: any = isSuperAdmin
    ? {}
    : { incidentWard: session.wardNumber };

  if (statusFilter && statusFilter !== "ALL") {
    whereClause.status = statusFilter;
  }

  const complaints = await prisma.complaint.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      issueId: true,
      title: true,
      category: true,
      status: true,
      author: true,
      incidentWard: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Complaints Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isSuperAdmin
              ? "Platform-wide grievance tracking across all Avadi wards."
              : `Complaints lodged in Ward ${session.wardNumber}.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Total in View: <strong>{complaints.length}</strong>
          </span>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Issue ID</th>
                <th className="px-6 py-3.5">Details</th>
                <th className="px-6 py-3.5">Category</th>
                {isSuperAdmin && <th className="px-6 py-3.5">Ward</th>}
                <th className="px-6 py-3.5">Status (Action)</th>
                <th className="px-6 py-3.5">Reported</th>
                <th className="px-6 py-3.5 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {complaints.map((complaint) => (
                <ComplaintRow
                  key={complaint.id}
                  complaint={complaint}
                  isSuperAdmin={isSuperAdmin}
                />
              ))}
              {complaints.length === 0 && (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 7 : 6}
                    className="px-6 py-16 text-center text-slate-400"
                  >
                    No complaints found matching this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
