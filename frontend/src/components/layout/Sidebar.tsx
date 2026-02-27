"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Gauge,
  ShoppingBag,
  CreditCard,
  Landmark,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Credit Score", icon: Gauge },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/loans", label: "My Loans", icon: CreditCard },
  { href: "/lend", label: "Lend", icon: Landmark },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Kred</h1>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            BNB Chain
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary glow-cyan"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border border-cyan-900/30 p-3">
          <p className="text-xs font-medium text-cyan-400">Hackathon Demo</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            BNB Chain x YZi Labs 2026
          </p>
        </div>
      </div>
    </aside>
  );
}
