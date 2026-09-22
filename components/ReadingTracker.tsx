"use client";

import { useEffect, useRef } from "react";

export default function ReadingTracker({
  chapterId,
}: {
  chapterId: string;
}) {
  const sentRef = useRef(false);

  useEffect(() => {
    sentRef.current = false;

    const recordRead = () => {
      if (sentRef.current) return;
      sentRef.current = true;

      fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chapterId,
        }),
      }).catch(() => { });
    };

    // 1. Tự động ghi nhận sau khi người dùng ở lại trang ít nhất 6 giây
    const timer = setTimeout(() => {
      recordRead();
    }, 6000);

    // 2. Ghi nhận khi người dùng cuộn xem nội dung (>15% hoặc >400px)
    const handleScroll = () => {
      if (sentRef.current) return;

      const scrollY = window.scrollY || window.pageYOffset;
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (
        (scrollableHeight > 0 && scrollY / scrollableHeight >= 0.15) ||
        scrollY >= 400
      ) {
        recordRead();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [chapterId]);

  return null;
}

