import { init } from "@instantdb/react";

import schema from "../../../instant.schema.ts";
import { readViteEnv } from "@/lib/runtimeEnv";

function resolveAppId(): string {
  return readViteEnv("VITE_INSTANT_APP_ID") ?? "00000000-0000-0000-0000-000000000000";
}

function resolveApiUri(): string | undefined {
  return readViteEnv("VITE_INSTANT_API_URI");
}

function resolveWebsocketUri(apiURI: string | undefined): string | undefined {
  const configured = readViteEnv("VITE_INSTANT_WEBSOCKET_URI");
  if (configured) return configured;
  if (!apiURI) return undefined;
  try {
    const url = new URL(apiURI);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/runtime/session";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

const apiURI = resolveApiUri();
const websocketURI = resolveWebsocketUri(apiURI);

export const db = init({
  appId: resolveAppId(),
  schema,
  devtool: false,
  ...(apiURI ? { apiURI } : {}),
  ...(websocketURI ? { websocketURI } : {}),
});
