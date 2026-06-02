'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, ReceiptText, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Enhanced Navbar Component
 * 
 * Floating-style sticky bottom navigation with modern icons and active states.
 */
export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'History', href: '/transactions', icon: ReceiptText },
    { label: 'Add', href: '/transactions/add', icon: Plus, primary: true },
    { label: 'Accounts', href: '/accounts', icon: CreditCard },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-between gap-2 px-3 py-2 bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2.5rem] card-shadow max-w-sm w-full z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.primary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 hover:scale-110 active:scale-95 transition-all animate-float relative -top-4"
            >
              <Plus size={28} strokeWidth={3} />
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all",
              isActive ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[9px] font-black uppercase mt-0.5 tracking-tighter">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
