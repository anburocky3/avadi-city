import React from "react";
import { IceCream, Leaf, WheatOff, MilkOff, EggOff } from "lucide-react";

// Authentic Indian Standard (FSSAI) Veg Symbol
export const VegSymbol = ({ className = "w-4 h-4" }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-emerald-600 dark:border-emerald-500 bg-white dark:bg-slate-900 rounded-[3px] p-[2px] shrink-0 ${className}`}
    title="Pure Vegetarian (FSSAI Verified)"
  >
    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
  </span>
);

// Authentic Indian Standard (FSSAI) Non-Veg Symbol
export const NonVegSymbol = ({ className = "w-4 h-4" }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-rose-600 dark:border-rose-500 bg-white dark:bg-slate-900 rounded-[3px] p-[2px] shrink-0 ${className}`}
    title="Non-Vegetarian (FSSAI Verified)"
  >
    <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-500" />
  </span>
);

// 100% Plant-Based Vegan Symbol
export const VeganSymbol = ({ className = "w-4 h-4" }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-teal-600 dark:border-teal-500 bg-white dark:bg-slate-900 rounded-[3px] p-[1px] shrink-0 text-teal-600 dark:text-teal-400 ${className}`}
    title="100% Vegan (Plant-Based)"
  >
    <Leaf size={10} className="fill-teal-600 dark:fill-teal-400" />
  </span>
);

// Gluten-Free Symbol
export const GlutenFreeSymbol = ({ className = "w-4 h-4" }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-amber-600 dark:border-amber-500 bg-white dark:bg-slate-900 rounded-[3px] p-[1px] shrink-0 text-amber-600 dark:text-amber-400 ${className}`}
    title="Gluten-Free"
  >
    <WheatOff size={10} />
  </span>
);

// Dairy-Free Symbol
export const DairyFreeSymbol = ({ className = "w-4 h-4" }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-sky-600 dark:border-sky-500 bg-white dark:bg-slate-900 rounded-[3px] p-[1px] shrink-0 text-sky-600 dark:text-sky-400 ${className}`}
    title="Dairy-Free (Lactose-Free)"
  >
    <MilkOff size={10} />
  </span>
);

// Egg-Free / 100% Eggless Symbol
export const EggFreeSymbol = ({ className = "w-4 h-4" }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-yellow-500 dark:border-yellow-400 bg-white dark:bg-slate-900 rounded-[3px] p-[1px] shrink-0 text-yellow-600 dark:text-yellow-400 ${className}`}
    title="Egg-Free (100% Eggless)"
  >
    <EggOff size={10} />
  </span>
);

// Professional Dessert / Ice Cream Icon Badge
export const IceCreamSymbol = ({ className = "w-4 h-4" }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/60 rounded-[3px] text-purple-600 dark:text-purple-300 p-px shrink-0 ${className}`}
    title="Desserts & Ice Creams"
  >
    <IceCream size={10} />
  </span>
);

