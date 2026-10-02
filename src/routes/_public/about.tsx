import { createFileRoute } from "@tanstack/react-router";

import { AboutContent } from "@/components/navigation/AboutContent";

export const Route = createFileRoute("/_public/about")({
  component: AboutContent,
});
