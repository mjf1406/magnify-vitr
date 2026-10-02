import type { InstantRules } from "@instantdb/react";

import { ALLOWED_EMAIL } from "./shared/access.ts";

/**
 * Flip this when cloning, then push perms.
 * - false (default): every read and write requires the allowed account.
 * - true: anonymous visitors can read published file records and `public/` storage paths.
 *   Writes stay locked to the allowed account.
 */
export const PUBLIC_READ = false;

const isSelf = "auth.id == data.id";
const isOwnProfile = "auth.id in data.ref('$user.id')";
const isFileOwner = "auth.id in data.ref('owner.id')";
const isPresetOwner = "auth.id in data.ref('owner.id')";
const isAllowedUser = `auth.email == '${ALLOWED_EMAIL}'`;
const canWrite = isAllowedUser;

const fileRecordView = PUBLIC_READ ? `data.visibility == 'public' || ${canWrite}` : canWrite;
const fileView = PUBLIC_READ ? `data.path.startsWith('public/') || ${canWrite}` : canWrite;
const ownedOrPublicPath = `${canWrite} && (data.path.startsWith('users/' + auth.id + '/') || data.path.startsWith('public/'))`;

const rules = {
  attrs: {
    allow: {
      $default: "false",
    },
  },
  $users: {
    allow: {
      view: isSelf,
      create: `data.email == '${ALLOWED_EMAIL}'`,
      update: "false",
    },
    fields: {
      email: isSelf,
    },
  },
  $files: {
    allow: {
      view: fileView,
      create: ownedOrPublicPath,
      delete: ownedOrPublicPath,
      update: "false",
    },
  },
  profiles: {
    allow: {
      view: canWrite,
      create: `${canWrite} && ${isOwnProfile}`,
      update: `${canWrite} && ${isOwnProfile}`,
      delete: "false",
    },
  },
  fileRecords: {
    allow: {
      view: fileRecordView,
      create: `${canWrite} && ${isFileOwner}`,
      update: `${canWrite} && ${isFileOwner}`,
      delete: `${canWrite} && ${isFileOwner}`,
    },
  },
  presets: {
    allow: {
      view: `${canWrite} && ${isPresetOwner}`,
      create: `${canWrite} && ${isPresetOwner}`,
      update: `${canWrite} && ${isPresetOwner}`,
      delete: `${canWrite} && ${isPresetOwner}`,
    },
  },
} satisfies InstantRules;

export default rules;
