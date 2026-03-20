"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { usePathname, useRouter } from "next/navigation";

export function CapacitorApp() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const backListener = App.addListener("backButton", () => {
        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/login"
        ) {
          App.exitApp();
        } else {
          router.back();
        }
      });

      return () => {
        backListener.then((listener) => listener.remove());
      };
    }
  }, [pathname, router]);

  return null;
}
