"use client";

import { useEffect } from "react";

export default function ReadingTracker({
  chapterId,
}: {
  chapterId: string;
}) {
  useEffect(() => {
    fetch("/api/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chapterId,
      }),
    }).catch(() => { });
  }, [chapterId]);

  return null;
}
