"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Wrench,
  ArrowRight,
  PlusCircle,
  FileText,
  Building2,
  Bell,
  UserCheck,
  Zap,
  Link as LinkIcon,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWard } from "@/context/wardContext";
import { Modal } from "@/components/shared-components";
import { useWardAdminProfile } from "@/hooks/useWardAdminProfile";
import { OfficialAdminData, OFFICIALS_DIRECTORY } from "@/data/officialsData";
import { ComplaintGuideSteps } from "./complaint-guide-steps";

export default function ComplaintsOverview() {
  const router = useRouter();
  const { activeWard } = useWard();

  const [isGovtServicesModalOpen, setIsGovtServicesModalOpen] =
    useState<boolean>(false);
  const [selectedAdminModal, setSelectedAdminModal] =
    useState<OfficialAdminData | null>(null);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 font-sans select-none">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              Civic Grievance Redressal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Log local issues and track resolutions
            </p>
          </div>
          <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black border border-orange-500/20 shrink-0 w-fit">
            <MapPin size={14} />
            <span>Ward {String(activeWard.id).padStart(2, "0")}</span>
          </span>
        </div>

        <ComplaintGuideSteps />

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center">
              <Wrench size={18} className="text-primary mr-2" />
              <span>Services & Actions</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: "Report Issue",
                desc: "Log local problems like garbage, water, roads, or streetlights and get a tracking ID.",
                icon: PlusCircle,
                badgeBg: "from-orange-500 to-amber-500",
                action: () => router.push("/complaints/report"),
              },
              {
                name: "My Complaints",
                desc: "Track active status updates, zonal officer replies, and resolution proof photos.",
                icon: FileText,
                badgeBg: "from-teal-500 to-emerald-600",
                action: () => router.push("/complaints/active"),
              },
              {
                name: "Govt e-Services",
                desc: "Access property tax payment, EB bills, birth certificates, and RTO portals.",
                icon: Building2,
                badgeBg: "from-purple-600 to-indigo-700",
                action: () => setIsGovtServicesModalOpen(true),
              },
              {
                name: "Local Ward Alerts",
                desc: "View urgent weather advisories, water supply cuts, and road closure notices.",
                icon: Bell,
                badgeBg: "from-blue-500 to-indigo-600",
                action: () => router.push("/notifications"),
              },
            ].map((srv) => (
              <motion.div
                key={srv.name}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={srv.action}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`p-3 rounded-2xl bg-linear-to-br ${srv.badgeBg} text-white shadow-md shrink-0`}
                  >
                    <srv.icon size={18} />
                  </div>
                  <span className="text-xs font-bold text-primary flex items-center">
                    Open <ArrowRight size={12} className="ml-1" />
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {srv.name}
                  </h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug mt-1">
                    {srv.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Administration Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center">
              <UserCheck size={18} className="text-primary mr-2" />
              <span>Administration & Officials</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              Grievance officers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: "MLA Office", data: OFFICIALS_DIRECTORY.mla },
              { key: "Mayor Office", data: OFFICIALS_DIRECTORY.mayor },
              { key: "Commissioner", data: OFFICIALS_DIRECTORY.commissioner },
              { key: "Ward Admin", data: useWardAdminProfile() },
            ].map(({ key, data }) => {
              const IconComponent = data.icon;
              return (
                <motion.div
                  key={key}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAdminModal(data)}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between group min-h-40 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 z-10">
                    {data.avatar ? (
                      <div className="relative">
                        <img
                          src={data.avatar}
                          alt={data.name}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform duration-300 bg-slate-100 dark:bg-slate-800"
                        />
                        <div
                          className={`absolute -bottom-1 -right-1 p-1 rounded-lg bg-linear-to-br ${data.badgeBg} text-white shadow-sm`}
                        >
                          <IconComponent size={12} />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-2xl bg-linear-to-br ${data.badgeBg} text-white flex items-center justify-center shadow-md shrink-0`}
                      >
                        <IconComponent size={24} />
                      </div>
                    )}

                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center transition-colors shrink-0">
                      <span>Contact</span>
                      <ArrowRight size={11} className="ml-1" />
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 z-10">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {data.party ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${data.partyStyle || "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}
                        >
                          ★ Party: {data.party}
                        </span>
                      ) : data.department ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 truncate max-w-full">
                          {data.department}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors line-clamp-1">
                        {data.name}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                        {data.role}
                      </p>
                    </div>
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="space-y-3 pt-2 mb-10">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center">
              <LinkIcon size={18} className="text-primary mr-2" />
              <span>Helplines & Portals</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              24x7 Emergency utilities
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: "EB (Electricity Board)",
                desc: "TANGEDCO power outage & fuse failure helpline",
                data: OFFICIALS_DIRECTORY.eb,
                badgeBg: "from-yellow-500 to-amber-600",
              },
              {
                name: "Corporation Contact",
                desc: "Avadi HQ Grievance & Toll-Free Helpline",
                data: OFFICIALS_DIRECTORY.corporationHQ,
                badgeBg: "from-cyan-600 to-blue-700",
              },
            ].map((item) => (
              <motion.div
                key={item.name}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAdminModal(item.data)}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-2xl bg-linear-to-br ${item.badgeBg} text-white shadow-sm shrink-0`}
                  >
                    <Zap size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  View
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating Plus Button to Report Issue */}
      <button
        onClick={() => router.push("/complaints/report")}
        className="fixed bottom-20 right-4 z-40 md:absolute md:bottom-auto md:top-0 md:right-0 md:mt-1 w-14 h-14 rounded-full bg-primary hover:bg-orange-600 text-white flex items-center justify-center shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer"
      >
        <Plus size={26} />
      </button>

      {/* Admin Contact Details Modal */}
      {selectedAdminModal && (
        <Modal
          isOpen={!!selectedAdminModal}
          onClose={() => setSelectedAdminModal(null)}
          title={selectedAdminModal.title}
        >
          <div className="space-y-5">
            <div className="flex items-center space-x-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              {selectedAdminModal.avatar ? (
                <img
                  src={selectedAdminModal.avatar}
                  alt={selectedAdminModal.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md shrink-0 bg-slate-100 dark:bg-slate-800"
                />
              ) : (
                <div
                  className={`w-16 h-16 rounded-2xl bg-linear-to-br ${selectedAdminModal.badgeBg} text-white flex items-center justify-center shadow-md shrink-0`}
                >
                  <selectedAdminModal.icon size={30} />
                </div>
              )}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    {selectedAdminModal.role}
                  </span>
                  {selectedAdminModal.party && (
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${selectedAdminModal.partyStyle || "bg-red-500/10 text-red-600"}`}
                    >
                      Party: {selectedAdminModal.party}
                    </span>
                  )}
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight truncate">
                  {selectedAdminModal.name}
                </h3>
                {selectedAdminModal.jurisdiction && (
                  <p className="text-xs font-semibold text-slate-400 truncate">
                    📍 {selectedAdminModal.jurisdiction}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Phone size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-400 block">
                      Phone Number
                    </span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
                      {selectedAdminModal.phone}
                    </span>
                  </div>
                </div>
                <a
                  href={`tel:${selectedAdminModal.phone.replace(/\s+/g, "")}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center space-x-2 shrink-0 shadow-sm"
                >
                  <Phone size={14} />
                  <span>Call</span>
                </a>
              </div>
              {selectedAdminModal.email.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <Mail size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-400 block">
                        Official Email
                      </span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
                        {selectedAdminModal.email}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`mailto:${selectedAdminModal.email}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition flex items-center space-x-2 shrink-0 shadow-sm"
                  >
                    <Mail size={14} />
                    <span>Email</span>
                  </a>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start space-x-3 shadow-sm">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block">
                    Office Address & Timings
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-relaxed block mt-1">
                    {selectedAdminModal.office}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center">
                    <Clock size={14} className="mr-1 text-amber-500" />
                    <span>{selectedAdminModal.timings}</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedAdminModal(null)}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </Modal>
      )}

      {/* Govt e-Services Modal */}
      <Modal
        isOpen={isGovtServicesModalOpen}
        onClose={() => setIsGovtServicesModalOpen(false)}
        title="Official Government & Municipal e-Services"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Access official Tamil Nadu State & Avadi Municipal Corporation
            digital portals for tax payments, certificates, and civic services.
          </p>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {[
              {
                title: "Property & Water Tax Online Payment",
                dept: "Avadi Municipal Corporation (TN Urban e-Pay)",
                link: "https://www.tnurbanepay.tn.gov.in",
                desc: "Pay property tax, water charges, professional tax online & download receipts instantly.",
                badge: "Tax e-Pay",
                badgeBg:
                  "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
              },
              {
                title: "TANGEDCO Electricity Bill Payment & Outages",
                dept: "Tamil Nadu Electricity Board (TNEB)",
                link: "https://www.tangedco.gov.in",
                desc: "Pay monthly EB electricity bills online, register power failure complaints & track connections.",
                badge: "EB Power",
                badgeBg:
                  "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
              },
              {
                title: "TN e-Sevai Revenue Certificates Portal",
                dept: "TNeGA Government of Tamil Nadu",
                link: "https://www.tnesevai.tn.gov.in",
                desc: "Apply online for Community Certificate, Income Certificate, Residence Certificate & First Graduate.",
                badge: "e-Sevai",
                badgeBg:
                  "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
              },
            ].map((service, idx) => (
              <motion.a
                key={idx}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                href={service.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary/60 transition-all flex items-start justify-between gap-3 group shadow-sm"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${service.badgeBg}`}
                    >
                      {service.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-400 truncate">
                      {service.dept}
                    </span>
                  </div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {service.title}
                  </h4>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug">
                    {service.desc}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-primary group-hover:border-primary flex items-center justify-center shrink-0 transition-colors mt-1 shadow-sm">
                  <ExternalLink size={18} />
                </div>
              </motion.a>
            ))}
          </div>
          <button
            onClick={() => setIsGovtServicesModalOpen(false)}
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
