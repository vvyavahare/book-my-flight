"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const { isAuthenticated, isAdmin, username, logout, ready } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-sm">
            ✈
          </span>
          <span className="text-slate-800">AirGo</span>
        </Link>

        {ready && (
          <div className="flex items-center gap-3 text-sm">
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="rounded-lg bg-indigo-50 px-3 py-1.5 font-medium text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Admin
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/"
                      className="rounded-lg px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Search
                    </Link>
                    <Link
                      href="/bookings"
                      className="rounded-lg px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      My bookings
                    </Link>
                  </>
                )}
                <span className="hidden text-slate-500 sm:inline">
                  Signed in as{" "}
                  <span className="font-medium text-slate-700">{username}</span>
                  {isAdmin && (
                    <span className="ml-1.5 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                      admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white transition hover:bg-slate-700"
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
