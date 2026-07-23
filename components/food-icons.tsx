import { IceCream } from "lucide-react";

// Authentic Indian Standard (FSSAI) Veg Symbol
export const VegSymbol = ({ className = "w-4 h-4" }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-emerald-600 dark:border-emerald-500 bg-white dark:bg-slate-900 rounded-[3px] p-[2px] shrink-0 ${className}`}
    title="Pure Vegetarian (FSSAI Verified)"
  >
    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
  </span>
);

// Authentic Indian Standard (FSSAI) Non-Veg Symbol
export const NonVegSymbol = ({ className = "w-4 h-4" }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-rose-600 dark:border-rose-500 bg-white dark:bg-slate-900 rounded-[3px] p-[2px] shrink-0 ${className}`}
    title="Non-Vegetarian (FSSAI Verified)"
  >
    <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-500" />
  </span>
);

// Professional Dessert / Ice Cream Icon Badge
export const IceCreamSymbol = ({ className = "w-4 h-4" }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/60 rounded-[3px] text-purple-600 dark:text-purple-300 p-[1px] shrink-0 ${className}`}
    title="Desserts & Ice Creams"
  >
    <IceCream size={10} />
  </span>
);
