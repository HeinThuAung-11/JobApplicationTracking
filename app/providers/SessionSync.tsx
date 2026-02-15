"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user?.id && session.user.email) {
      const syncAfterLogin = async () => {
        dispatch(
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          })
        );

        const localJobs = loadJobsFromLocalStorage();
        dispatch(setUseLocalStorage(false));

        if (localJobs.length > 0) {
          const result = await dispatch(migrateLocalJobs({ jobs: localJobs }));
          if (migrateLocalJobs.fulfilled.match(result)) {
            clearLocalStorageData();
          } else {
            // Fall back to guest mode if migration fails to avoid silent data loss.
            dispatch(setUseLocalStorage(true));
            return;
          }
        }

        await dispatch(fetchJobs());
        await dispatch(fetchDashboard());
      };

      void syncAfterLogin();
      return;
    }

    dispatch(logout());
    dispatch(setUseLocalStorage(true));
    void dispatch(fetchJobs());
    void dispatch(fetchDashboard());
  }, [dispatch, session, status]);

  return null;
}
