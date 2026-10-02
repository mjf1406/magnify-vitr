import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ConversationPage } from "@/components/conversation/ConversationPage";

const talkSearchSchema = z.object({
  c: z.string().min(1).optional(),
});

export const Route = createFileRoute("/_public/talk")({
  validateSearch: talkSearchSchema,
  component: ConversationPage,
});
