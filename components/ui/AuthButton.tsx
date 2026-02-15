"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return <div className="h-9 w-24 bg-slate-200 animate-pulse rounded-lg"></div>;
  }

  if (!session) {
    return (
      <Button onClick={() => signIn()} variant="primary">
        Login
      </Button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
        {session.user?.image ? (
          <img src={session.user.image} alt={session.user.name || "User"} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
            {session.user?.email?.[0].toUpperCase() || "U"}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 hidden sm:block">
          {session.user?.name || session.user?.email?.split("@")[0]}
        </span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${showMenu ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-medium text-slate-900">{session.user?.name || "User"}</p>
            <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
