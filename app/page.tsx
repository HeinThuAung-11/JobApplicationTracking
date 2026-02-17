"use client";

import { JobCard } from "@/components/jobs/JobCard";
import { Alert, Button, Card, CardHeader, CardTitle, Spinner } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearErrorDashboard, fetchDashboard, selectIsGuestMode } from "@/store/jobsSlice";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { dashboard, loadingDashboard, errorDashboard } = useAppSelector((state) => state.jobs);
  const isGuestMode = useAppSelector(selectIsGuestMode);
  const isAuthLoading = useAppSelector((state) => state.auth.isLoading);

  useEffect(() => {
    void dispatch(fetchDashboard());
  }, [dispatch]);

  if (loadingDashboard && !dashboard) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (errorDashboard && !dashboard) {
    return (
      <div className="mx-auto max-w-6xl">
        <Alert variant="error" message={errorDashboard} onDismiss={() => dispatch(clearErrorDashboard())} />
        <Button variant="secondary" className="mt-4" onClick={() => void dispatch(fetchDashboard())}>
          Retry
        </Button>
      </div>
    );
  }

  const stats = dashboard ?? {
    total: 0,
    byStatus: {} as Record<string, number>,
    recent: [],
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">Overview of your job applications</p>
      </div>

      {!isAuthLoading && isGuestMode && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">Guest Mode - Data Stored Locally</h3>
              <p className="mt-1 text-sm text-amber-800">
                You&apos;re currently using the app as a guest. Your data is stored in your browser&apos;s localStorage and will
                be lost if you clear your browser data.{" "}
                <Link href="/login" className="font-medium underline hover:text-amber-900">
                  Login to save your data to the cloud
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Total applications</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{stats.total}</p>
        </Card>
        {Object.entries(stats.byStatus).map(([status, count]) => (
          <Card key={status}>
            <p className="text-sm font-medium text-slate-500 capitalize">{status}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{count}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent applications</CardTitle>
          <Link href="/jobs" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </CardHeader>
        {loadingDashboard && stats.recent.length > 0 ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : stats.recent.length === 0 ? (
          <p className="py-8 text-center text-slate-500">
            No applications yet.{" "}
            <Link href="/jobs/new" className="text-primary-600 hover:underline">
              Add your first job
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recent.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
