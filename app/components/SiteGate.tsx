"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function SiteGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    // Trang unlock luôn được phép vào
    if (pathname === "/unlock") {
      setUnlocked(true);
      setChecking(false);
      return;
    }

    const checkSiteLock = async () => {
      try {
        const response = await fetch(
          "/api/site-lock",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = (await response.json()) as {
  success?: boolean;
  unlocked?: boolean;
};

        if (data.success && data.unlocked) {
          setUnlocked(true);
        } else {
          window.location.href = "/unlock";
        }
      } catch {
        window.location.href = "/unlock";
      } finally {
        setChecking(false);
      }
    };

    void checkSiteLock();
  }, [pathname]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Đang kiểm tra...
      </div>
    );
  }

  if (!unlocked) {
    return null;
  }

  return <>{children}</>;
}