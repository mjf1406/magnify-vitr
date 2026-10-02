import { createFileRoute } from "@tanstack/react-router";

import { FilesPage } from "@/components/files/FilesPage";

export const Route = createFileRoute("/_authenticated/_app/files")({
  component: FilesPage,
});
