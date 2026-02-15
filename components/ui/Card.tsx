"use client";

import { memo, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = memo(function Card({
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardHeader = memo(function CardHeader({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["mb-4", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
});

export const CardTitle = memo(function CardTitle({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={["text-lg font-semibold text-slate-900", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </h3>
  );
});
