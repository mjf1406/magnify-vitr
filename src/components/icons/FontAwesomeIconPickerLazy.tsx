import { lazy, Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import type { FontAwesomeIconPickerProps } from "./FontAwesomeIconPicker";

const FontAwesomeIconPicker = lazy(() =>
  import("./FontAwesomeIconPicker").then((m) => ({
    default: m.FontAwesomeIconPicker,
  })),
);

function PickerFallback() {
  return <Skeleton className="h-9 w-32" />;
}

export function FontAwesomeIconPickerLazy(props: FontAwesomeIconPickerProps) {
  return (
    <Suspense fallback={<PickerFallback />}>
      <FontAwesomeIconPicker {...props} />
    </Suspense>
  );
}
