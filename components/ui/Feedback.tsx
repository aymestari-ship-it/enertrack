import type { ReactNode } from "react";

// One look for empty, error, success and loading states across the app.

export function EmptyState({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`flex items-center justify-center rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-subtle ${className}`}
    >
      {children}
    </p>
  );
}

export function ErrorMessage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={`rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger ${className}`}>
      {children}
    </p>
  );
}

export function SuccessMessage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p role="status" className={`rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-ink ${className}`}>
      {children}
    </p>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
