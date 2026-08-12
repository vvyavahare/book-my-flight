"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/** Redirects to /login when unauthenticated, or to / when authenticated but not an admin. */
export function useRequireAdmin() {
  const { isAuthenticated, isAdmin, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (!isAdmin) {
      router.replace("/");
    }
  }, [ready, isAuthenticated, isAdmin, router]);

  return { ready, isAuthenticated, isAdmin };
}
