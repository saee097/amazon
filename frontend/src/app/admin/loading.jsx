import { AdminPageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageSkeleton variant="table" />
    </div>
  );
}
