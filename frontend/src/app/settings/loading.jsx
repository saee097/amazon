import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageSkeleton variant="form" />
    </div>
  );
}
