"use client";

import { useEffect, useState } from "react";

export default function AdminHeader() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setTime(
        now.toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour12: false,
        })
      );
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-purple-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex min-h-16 items-center justify-between px-6">
        {/* TITLE */}
        <div>
          <h1 className="text-lg font-extrabold text-purple-900">
            Thống kê nội dung nhóm dịch
          </h1>

          <p className="mt-0.5 text-xs text-gray-500">
            Yoru Translation Group
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4 text-sm">
          {/* TIME */}
          <div className="hidden border-r border-gray-200 pr-4 text-gray-500 sm:block">
            {time}
          </div>

          {/* LANGUAGE */}
          <button
            type="button"
            className="rounded-lg px-2 py-1 font-semibold text-gray-600 transition hover:bg-purple-50"
          >
            VI ▾
          </button>

          {/* USER */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-sm font-extrabold text-white">
              Y
            </div>

            <span className="hidden font-semibold text-gray-700 sm:block">
              Yoru
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}