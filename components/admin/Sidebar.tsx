"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuSections = [
  {
    title: "TỔNG QUAN",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: "▦",
      },
      {
        label: "Thống kê nhóm",
        href: "/admin/statistics",
        icon: "▥",
      },
    ],
  },
  {
    title: "NỘI DUNG",
    items: [
      {
        label: "Nhóm dịch",
        href: "/admin?tab=group",
        icon: "♧",
      },
      {
        label: "Truyện",
        href: "/admin/manga",
        icon: "▣",
      },
    ],
  },
  {
    title: "HỆ THỐNG",
    items: [
      {
        label: "Báo cáo truyện",
        href: "/admin/reports",
        icon: "⚠",
      },
      {
        label: "Góp ý người dùng",
        href: "/admin/feedback",
        icon: "▤",
      },
      {
        label: "Bình luận",
        href: "/admin/comments",
        icon: "◌",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-56 flex-col bg-gradient-to-b from-[#8b00d9] via-[#9d0cce] to-[#b51bbf] text-white shadow-xl">
      
      {/* LOGO */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <Link
          href="/admin"
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 font-extrabold">
            Y
          </div>

          <span className="text-lg font-extrabold">
            YoruComic
          </span>
        </Link>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lg transition hover:bg-white/20"
        >
          «
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto px-2 py-5">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-7">
            
            <p className="mb-3 px-3 text-[11px] font-bold tracking-wide text-purple-200">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (
                    item.href !== "/admin" &&
                    pathname.startsWith(
                      `${item.href}/`
                    )
                  );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white/20 shadow-sm"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-white/15"
                          : "bg-white/10"
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* FOOTER SIDEBAR */}
      <div className="border-t border-white/10 p-4">
        <p className="text-xs text-purple-200">
          Yoru Translation Group
        </p>

        <p className="mt-1 text-[10px] text-purple-300">
          Admin Panel
        </p>
      </div>
    </aside>
  );
}