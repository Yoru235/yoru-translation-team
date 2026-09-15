"use client";

import { useEffect, useState } from "react";
import UnlockModal from "./UnlockModal";

export default function SiteGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const checkSiteLock = async () => {
      try {
        const response = await fetch("/api/site-lock", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as {
          success?: boolean;
          unlocked?: boolean;
        };

        if (data.success && data.unlocked) {
          setUnlocked(true);
        } else {
          setUnlocked(false);
        }
      } catch {
        setUnlocked(false);
      } finally {
        setChecking(false);
      }
    };

    void checkSiteLock();
  }, []);

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-black">
        <div className="opacity-0 pointer-events-none select-none">
          {children}
        </div>

        {!checking && (
          <UnlockModal onUnlocked={() => setUnlocked(true)} />
        )}
      </div>
    );
  }

  return <>{children}</>;
}