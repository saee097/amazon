import type { HTMLAttributes, ReactNode } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  rounded?: string;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Skeleton({ className, rounded = "rounded-md", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx("shimmer-bg block", rounded, className)}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
  lineClassName = "h-3 w-full",
  gap = "gap-2",
}: {
  lines?: number;
  className?: string;
  lineClassName?: string;
  gap?: string;
}) {
  return (
    <div aria-hidden="true" className={cx("flex flex-col", gap, className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          rounded="rounded"
          className={cx(
            lineClassName,
            index === lines - 1 && lines > 1 ? "w-3/5" : ""
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <Skeleton rounded="rounded-full" className={cx("h-10 w-10", className)} />;
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton rounded="rounded-lg" className={cx("h-10 w-32", className)} />;
}

export function SkeletonInput({ className }: { className?: string }) {
  return <Skeleton rounded="rounded-lg" className={cx("h-11 w-full", className)} />;
}

export function SkeletonProductCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      <Skeleton rounded="rounded-none" className="aspect-product w-full" />
      <div className="space-y-3 p-4">
        <Skeleton rounded="rounded" className="h-3 w-1/3" />
        <Skeleton rounded="rounded" className="h-4 w-4/5" />
        <Skeleton rounded="rounded" className="h-5 w-1/2" />
        <Skeleton rounded="rounded-full" className="h-9 w-full" />
      </div>
    </div>
  );
}

export function SkeletonCartItem({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      <Skeleton rounded="rounded-lg" className="h-24 w-20 shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton rounded="rounded" className="h-4 w-2/3" />
        <Skeleton rounded="rounded" className="h-3 w-1/3" />
        <Skeleton rounded="rounded" className="h-5 w-24" />
      </div>
      <Skeleton rounded="rounded-lg" className="h-9 w-9 shrink-0" />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton key={index} rounded="rounded" className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 border-b border-gray-100 px-4 py-4 last:border-b-0 dark:border-gray-800"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              rounded="rounded"
              className={cx("h-3 flex-1", colIndex === 0 && "max-w-[10rem]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cx("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <Skeleton rounded="rounded" className="h-3 w-24" />
            <Skeleton rounded="rounded-full" className="h-8 w-8" />
          </div>
          <Skeleton rounded="rounded" className="mt-4 h-7 w-20" />
          <Skeleton rounded="rounded" className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({
  count = 3,
  className,
  itemClassName,
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div aria-hidden="true" className={cx("space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cx(
            "rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800",
            itemClassName
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <Skeleton rounded="rounded" className="h-4 w-40" />
            <Skeleton rounded="rounded-full" className="h-6 w-20" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((__, cellIndex) => (
              <div key={cellIndex}>
                <Skeleton rounded="rounded" className="h-3 w-16" />
                <Skeleton rounded="rounded" className="mt-2 h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({
  fields = 4,
  className,
  submit = true,
}: {
  fields?: number;
  className?: string;
  submit?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "space-y-5 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton rounded="rounded" className="h-3 w-28" />
          <SkeletonInput />
        </div>
      ))}
      {submit && <SkeletonButton className="w-40" />}
    </div>
  );
}

export function SkeletonProductGrid({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonProductCard key={index} />
      ))}
    </div>
  );
}

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("mb-6 space-y-3", className)}>
      <Skeleton rounded="rounded" className="h-3 w-24" />
      <Skeleton rounded="rounded-lg" className="h-8 w-56" />
      <Skeleton rounded="rounded" className="h-3 w-72 max-w-full" />
    </div>
  );
}

type PageSkeletonVariant =
  | "default"
  | "grid"
  | "list"
  | "table"
  | "stats"
  | "form"
  | "detail";

function PageSkeletonContent({ variant = "default" }: { variant?: PageSkeletonVariant }) {
  if (variant === "grid") {
    return (
      <div className="space-y-6">
        <Skeleton rounded="rounded-lg" className="h-32 w-full" />
        <SkeletonProductGrid />
      </div>
    );
  }

  if (variant === "list") {
    return <SkeletonList count={4} />;
  }

  if (variant === "table") {
    return (
      <div className="space-y-4">
        <SkeletonStats count={4} />
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  if (variant === "stats") {
    return (
      <div className="space-y-6">
        <SkeletonStats count={4} />
        <Skeleton rounded="rounded-lg" className="h-72 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton rounded="rounded-lg" className="h-56 w-full" />
          <Skeleton rounded="rounded-lg" className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return <SkeletonForm fields={5} />;
  }

  if (variant === "detail") {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton rounded="rounded-lg" className="aspect-product w-full" />
        <div className="space-y-5">
          <Skeleton rounded="rounded" className="h-4 w-24" />
          <Skeleton rounded="rounded-lg" className="h-8 w-4/5" />
          <Skeleton rounded="rounded" className="h-6 w-32" />
          <SkeletonText lines={4} />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} rounded="rounded-lg" className="h-20 w-full" />
            ))}
          </div>
          <SkeletonButton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Skeleton rounded="rounded-lg" className="h-40 w-full" />
      <Skeleton rounded="rounded-lg" className="h-8 w-48" />
      <SkeletonText lines={3} />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} rounded="rounded-lg" className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton({
  variant = "default",
  className,
  children,
}: {
  variant?: PageSkeletonVariant;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cx("min-h-[50vh] w-full", className)}
    >
      <span className="sr-only">Loading…</span>
      <PageHeaderSkeleton />
      {children ?? <PageSkeletonContent variant={variant} />}
    </div>
  );
}

export function StorefrontSkeleton({
  variant = "default",
  className,
  children,
}: {
  variant?: PageSkeletonVariant;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cx(
        "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
        className
      )}
    >
      <span className="sr-only">Loading…</span>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeaderSkeleton />
        {children ?? <PageSkeletonContent variant={variant} />}
      </div>
    </div>
  );
}

export function AdminPageSkeleton({
  variant = "table",
  className,
  children,
}: {
  variant?: PageSkeletonVariant;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cx("min-h-[50vh] w-full", className)}
    >
      <span className="sr-only">Loading…</span>
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-gray-800">
        <div className="space-y-2">
          <Skeleton rounded="rounded-lg" className="h-7 w-48" />
          <Skeleton rounded="rounded" className="h-3 w-32" />
        </div>
        <div className="flex gap-3">
          <SkeletonButton className="w-24" />
          <SkeletonButton className="w-32" />
        </div>
      </div>
      {children ?? <PageSkeletonContent variant={variant} />}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <SkeletonCircle className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <Skeleton rounded="rounded" className="h-4 w-1/3" />
          <Skeleton rounded="rounded" className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} className="mt-5" />
    </div>
  );
}

export function CartPageSkeleton({ className }: { className?: string }) {
  return (
    <StorefrontSkeleton className={className} variant="list">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Skeleton rounded="rounded-lg" className="mx-auto h-9 w-64" />
          <Skeleton rounded="rounded" className="mx-auto mt-4 h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCartItem key={index} />
            ))}
          </div>
          <div className="h-fit space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton rounded="rounded" className="h-5 w-32" />
            <Skeleton rounded="rounded" className="h-4 w-full" />
            <Skeleton rounded="rounded" className="h-4 w-full" />
            <Skeleton rounded="rounded" className="h-4 w-2/3" />
            <div className="flex justify-between">
              <Skeleton rounded="rounded" className="h-5 w-20" />
              <Skeleton rounded="rounded" className="h-6 w-24" />
            </div>
            <SkeletonButton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </StorefrontSkeleton>
  );
}

export function CheckoutPageSkeleton({ className }: { className?: string }) {
  return (
    <StorefrontSkeleton className={className}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <Skeleton rounded="rounded-lg" className="mx-auto h-9 w-64" />
          <Skeleton rounded="rounded" className="mx-auto mt-4 h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SkeletonForm fields={4} submit={false} />
            <SkeletonForm fields={3} submit={false} />
          </div>
          <div className="h-fit space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton rounded="rounded" className="h-5 w-36" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton rounded="rounded-lg" className="h-16 w-14 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton rounded="rounded" className="h-3 w-3/4" />
                  <Skeleton rounded="rounded" className="h-3 w-16" />
                </div>
                <Skeleton rounded="rounded" className="h-4 w-14" />
              </div>
            ))}
            <Skeleton rounded="rounded" className="h-px w-full" />
            <div className="flex justify-between">
              <Skeleton rounded="rounded" className="h-5 w-24" />
              <Skeleton rounded="rounded" className="h-6 w-28" />
            </div>
            <SkeletonButton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </StorefrontSkeleton>
  );
}

export function ProductDetailSkeleton({ className }: { className?: string }) {
  return (
    <StorefrontSkeleton className={className} variant="detail" />
  );
}

export function AuthSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cx(
        "flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950",
        className
      )}
    >
      <span className="sr-only">Loading…</span>
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col items-center">
          <SkeletonCircle className="h-16 w-16" />
          <Skeleton rounded="rounded-lg" className="mt-5 h-7 w-48" />
          <Skeleton rounded="rounded" className="mt-3 h-3 w-64 max-w-full" />
        </div>
        <SkeletonForm className="mt-8 border-0 p-0" fields={3} submit />
      </div>
    </div>
  );
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cx("min-h-screen bg-gray-50 dark:bg-gray-950", className)}
    >
      <span className="sr-only">Loading…</span>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <SkeletonCircle className="h-24 w-24" />
          <Skeleton rounded="rounded-lg" className="mt-5 h-7 w-56" />
          <Skeleton rounded="rounded" className="mt-3 h-3 w-40" />
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={index}
                rounded="rounded-lg"
                className="h-11 w-full"
              />
            ))}
          </div>
          <div className="lg:col-span-3">
            <CardSkeleton />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
