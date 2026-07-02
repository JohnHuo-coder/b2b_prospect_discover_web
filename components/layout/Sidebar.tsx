"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutGrid,
  Megaphone,
  Settings,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/human-review", label: "Human Review", icon: ClipboardList },
  { href: "/configuration", label: "Configuration", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <Megaphone className="h-5 w-5" />
        </div>
        <span className="text-base font-semibold text-gray-900">
          Lead Generation
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border border-violet-200 bg-violet-50 text-violet-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-violet-600" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
            CW
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              Clarence Weaver
            </p>
            <p className="truncate text-xs text-gray-500">
              c.weaver1on1@gmail.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
