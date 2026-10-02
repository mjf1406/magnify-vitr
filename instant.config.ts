import type { InstantConfig } from "instant-cli";

const apiURI = process.env.INSTANT_CLI_API_URI;
const dashURI = process.env.INSTANT_CLI_DASH_URI;

const config = {
  schema: "./instant.schema.ts",
  perms: "./instant.perms.ts",
  ...(apiURI ? { apiURI } : {}),
  ...(dashURI ? { dashURI } : {}),
} satisfies InstantConfig;

export default config;
