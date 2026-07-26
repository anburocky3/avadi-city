import { Heart } from "lucide-react";
import Link from "next/link";

export function GuestFooter() {
  return (
    <footer className="relative z-10 w-full py-6 px-4 text-center border-t border-slate-200/80 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
        {/* Navigation Links Group */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="hover:text-primary transition">
            Home
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link href="/contact" className="hover:text-orange-500 transition">
            Contact & Support
          </Link>
        </div>

        {/* Bullet Separator (Hidden on mobile stack) */}
        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">
          •
        </span>

        {/* Attribution Group */}
        <div className="flex items-center gap-1.5 justify-center flex-wrap text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span>Developed with</span>
          <Heart size={12} className="text-rose-500 fill-rose-500 inline" />
          <span>by</span>
          <a
            href="https://cyberdudenetworks.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-primary hover:underline"
          >
            CyberDude Networks Pvt. Ltd.
          </a>
        </div>
      </div>
    </footer>
  );
}
