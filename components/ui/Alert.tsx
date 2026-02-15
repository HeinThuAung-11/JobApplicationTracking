"use client";

import { memo } from "react";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  error: "bg-red-50 border-red-200 text-red-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-primary-50 border-primary-200 text-primary-800",
};

export const Alert = memo(function Alert({
  variant = "error",
  title,
  message,
  onDismiss,
  className = "",
}: AlertProps) {
  return (
    <div
      role="alert"
      className={[
        "rounded-lg border p-4",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {title && <p className="font-medium">{title}</p>}
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded p-1 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1"
            aria-label="Dismiss"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});
