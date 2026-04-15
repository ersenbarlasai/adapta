"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  Cog6ToothIcon 
} from "@heroicons/react/24/outline";

interface SidebarProps {
  terminology: {
    provider: string;
    client: string;
  };
}

export function Sidebar({ terminology }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Ana Sayfa", href: "/dashboard", icon: HomeIcon },
    { name: "Randevular", href: "/dashboard/appointments", icon: CalendarIcon },
    { name: `${terminology.client} Yönetimi`, href: "/dashboard/clients", icon: UserGroupIcon },
    { name: "Ayarlar", href: "/dashboard/settings", icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex flex-col w-64 bg-white border-r border-slate-200">
      <div className="flex items-center h-16 px-6 border-b border-slate-200">
        <span className="text-xl font-bold text-slate-900">AdaptA</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? "bg-slate-50 text-[var(--primary-color)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon 
                className={`w-5 h-5 mr-3 ${isActive ? "text-[var(--primary-color)]" : "text-slate-400"}`} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
