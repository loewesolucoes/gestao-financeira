"use client";

interface CustomProps {
  className?: string
}

export function Loader({ className }: CustomProps) {

  return (
    <div className={`loader spinner-border ${className}`} role="status" data-testid="app-loader">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}

