import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    profiles: i.entity({
      name: i.string().optional(),
      language: i.string().indexed(),
      createdAt: i.date().indexed(),
    }),
    fileRecords: i.entity({
      name: i.string(),
      contentType: i.string(),
      size: i.number(),
      preset: i.string().indexed(),
      visibility: i.string().indexed(),
      createdAt: i.date().indexed(),
    }),
    presets: i.entity({
      name: i.string(),
      doc: i.json(),
      style: i.json(),
      createdAt: i.date().indexed(),
      updatedAt: i.date().indexed(),
    }),
  },
  links: {
    profileUser: {
      forward: { on: "profiles", has: "one", label: "$user", required: true, onDelete: "cascade" },
      reverse: { on: "$users", has: "one", label: "profile" },
    },
    profileAvatar: {
      forward: { on: "profiles", has: "one", label: "avatar" },
      reverse: { on: "$files", has: "many", label: "profileAvatars" },
    },
    fileRecordFile: {
      forward: {
        on: "fileRecords",
        has: "one",
        label: "file",
        required: true,
        onDelete: "cascade",
      },
      reverse: { on: "$files", has: "one", label: "record" },
    },
    fileRecordOwner: {
      forward: { on: "fileRecords", has: "one", label: "owner", required: true },
      reverse: { on: "$users", has: "many", label: "files" },
    },
    presetOwner: {
      forward: { on: "presets", has: "one", label: "owner", required: true },
      reverse: { on: "$users", has: "many", label: "presets" },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
