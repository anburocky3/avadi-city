"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building2,
  ExternalLink,
  Search,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Zap,
  Droplet,
  CreditCard,
  Award,
  Car,
  Landmark,
  CheckCircle2,
  LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

// --- INLINE TYPESCRIPT DEFINITIONS ---

export interface GovtServiceItem {
  id: string;
  title: string;
  dept: string;
  category:
    | "Tax & Utility"
    | "Certificates"
    | "Civil Registry"
    | "Transport & RTO"
    | string;
  link: string;
  desc: string;
  badge: string;
  badgeBg: string;
  iconName: string;
}

export interface GovtServicesClientProps {
  initialServices: GovtServiceItem[];
}

// Icon mapper for serializable SSR props
const ICON_MAP: Record<string, LucideIcon> = {
  CreditCard,
  Zap,
  Award,
  FileText,
  Car,
  Landmark,
  Droplet,
  ShieldCheck,
};

const CATEGORIES = [
  "All",
  "Tax & Utility",
  "Certificates",
  "Civil Registry",
  "Transport & RTO",
];

export const GovtServicesClient: React.FC<GovtServicesClientProps> = ({
  initialServices,
}) => {
  const t = useTranslations("govtServices");
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredServices = useMemo(() => {
    return initialServices.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.dept.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q);
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, initialServices]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Title Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-1 text-xs font-bold text-primary hover:underline cursor-pointer mb-1.5"
          >
            <ArrowLeft size={13} />
            <span>{t("backToOverview")}</span>
          </button>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none flex items-center">
            <Building2 size={22} className="text-primary mr-2 shrink-0" />
            <span>{t("title")}</span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            {t("subtitle")}
          </p>
        </div>

        {/* Verified Badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0 self-start sm:self-auto">
          <CheckCircle2 size={14} />
          <span>{t("officialPortals")}</span>
        </div>
      </div>

      {/* Search & Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary shadow-sm"
          />
        </div>

        {/* Category Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            const categoryKey =
              cat === "All"
                ? "all"
                : cat === "Tax & Utility"
                  ? "taxUtility"
                  : cat === "Certificates"
                    ? "certificates"
                    : cat === "Civil Registry"
                      ? "civilRegistry"
                      : "transportRto";

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {t(`categories.${categoryKey}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => {
          const ServiceIcon = ICON_MAP[service.iconName] || Building2;
          return (
            <motion.a
              key={service.id}
              href={service.link}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.01, y: -2 }}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                      <ServiceIcon size={16} />
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${service.badgeBg}`}
                    >
                      {service.badge}
                    </span>
                  </div>
                  <span className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-primary group-hover:border-primary flex items-center justify-center shrink-0 transition-colors">
                    <ExternalLink size={14} />
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                    {service.dept}
                  </p>
                </div>

                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  {service.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-primary">
                <span>{t("launchPortal")}</span>
                <ExternalLink size={12} />
              </div>
            </motion.a>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <Building2
            size={32}
            className="mx-auto text-slate-300 dark:text-slate-600 mb-2"
          />
          <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
            {t("emptyTitle")}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{t("emptyDesc")}</p>
        </div>
      )}
    </div>
  );
};
