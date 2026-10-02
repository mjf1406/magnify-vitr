import { createFileRoute } from "@tanstack/react-router";

import { BigTextPage } from "@/components/bigtext/BigTextPage";

export const Route = createFileRoute("/_public/")({
  component: BigTextPage,
});
