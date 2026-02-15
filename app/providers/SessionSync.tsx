"use client";

import { useCallback, useEffect } from "react";
import { useRef } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch } from "@/store/hooks";
import { setUser, logout } from "@/store/authSlice";
import { clearLocalStorageData, loadJobsFromLocalStorage } from "@/lib/localStorage";
import {
  fetchDashboard,
  fetchJobs,
  migrateLocalJobs,
  setUseLocalStorage,
} from "@/store/jobsSlice";

export function SessionSync() {
  const dispatch = useAppDispatch();
  const { data: session, status } = useSession();
  const syncedUserIdRef = useRef<string | null>(null);

  const handleSignedOut = useCallback(() => {
    syncedUserIdRef.current = null;
    dispatch(logout());
    dispatch(setUseLocalStorage(true));
    void Promise.all([dispatch(fetchJobs()), dispatch(fetchDashboard())]);
  }, [dispatch]);

  const handleSignedIn = useCallback(
    async (user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    }) => {
      if (syncedUserIdRef.current === user.id) return;

      syncedUserIdRef.current = user.id;
      dispatch(setUser(user));

      const localJobs = loadJobsFromLocalStorage();
      dispatch(setUseLocalStorage(false));

      let migrated = false;
      if (localJobs.length > 0) {
        const result = await dispatch(migrateLocalJobs({ jobs: localJobs }));
        if (migrateLocalJobs.fulfilled.match(result)) {
          migrated = true;
        } else {
          dispatch(setUseLocalStorage(true));
          syncedUserIdRef.current = null;
          return;
        }
      }

      const [jobsResult, dashboardResult] = await Promise.all([
        dispatch(fetchJobs()),
        dispatch(fetchDashboard()),
      ]);
      if (fetchJobs.fulfilled.match(jobsResult) && fetchDashboard.fulfilled.match(dashboardResult)) {
        if (migrated) {
          clearLocalStorageData();
        }
        return;
      }

      dispatch(setUseLocalStorage(true));
      syncedUserIdRef.current = null;
    },
    [dispatch]
  );

  useEffect(() => {
    if (status === "loading") return;

    const userId = session?.user?.id;
    const email = session?.user?.email;
    if (userId && email) {
      void handleSignedIn({
        id: userId,
        email,
        name: session.user?.name ?? null,
        image: session.user?.image ?? null,
      });
      return;
    }

    handleSignedOut();
  }, [handleSignedIn, handleSignedOut, session, status]);

  return null;
}
