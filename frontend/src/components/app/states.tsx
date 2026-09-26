import { Inbox, AlertCircle } from "lucide-react";
import { errMsg } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export type LoadingVariant = "list" | "dashboard" | "cards" | "table" | "detail" | "form";

export function Loading({
  label = "Loading…",
  variant = "list",
  rows = 4,
}: {
  label?: string;
  variant?: LoadingVariant;
  rows?: number;
}) {
  if (variant === "dashboard") {
    return <DashboardSkeleton label={label} />;
  }
  if (variant === "cards") {
    return <CardGridSkeleton count={rows} label={label} />;
  }
  if (variant === "table") {
    return <TableSkeleton rows={rows} label={label} />;
  }
  if (variant === "detail") {
    return <DetailSkeleton label={label} />;
  }
  if (variant === "form") {
    return (
      <div
        className="space-y-4 rounded-2xl border bg-card p-6 shadow-2xs"
        role="status"
        aria-label={label}
      >
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-2xs"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-3.5 w-3/4 max-w-md" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-6 w-20 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton({ label = "Loading dashboard…" }: { label?: string }) {
  return (
    <div className="space-y-6" role="status" aria-label={label}>
      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Main Content Panels Skeleton */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 4,
  label = "Loading items…",
}: {
  count?: number;
  label?: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2" role="status" aria-label={label}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <div className="flex items-center gap-3 pt-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  label = "Loading table…",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div
      className="rounded-xl border bg-card overflow-hidden shadow-2xs"
      role="status"
      aria-label={label}
    >
      <div className="border-b bg-muted/40 px-4 py-3 flex items-center gap-4">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-20 ml-auto" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-60" />
            </div>
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton({ label = "Loading details…" }: { label?: string }) {
  return (
    <div className="space-y-6" role="status" aria-label={label}>
      <div className="space-y-2 border-b pb-4">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-36 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-background" role="status" aria-label="Loading workspace…">
      <header className="sticky top-0 z-30 border-b bg-card/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="hidden sm:block h-7 w-52 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r bg-sidebar px-3 py-5 md:block space-y-4">
          <Skeleton className="h-3.5 w-28 mx-3" />
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-5 sm:p-6 lg:p-8 space-y-6">
          <div className="space-y-2 border-b pb-4">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <DashboardSkeleton />
        </main>
      </div>
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed bg-muted/20 py-10 px-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground max-w-sm">{hint}</p>}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
      role="alert"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>Could not load: {errMsg(error)}</span>
    </div>
  );
}

export function PageHeader({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground max-w-2xl">{desc}</p>}
      </div>
      {children}
    </div>
  );
}
