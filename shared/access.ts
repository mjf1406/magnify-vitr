/** The only Google account that may sign up or write data. */
export const ALLOWED_EMAIL = "michael.fitzgerald.1406@gmail.com";

export function isAllowedEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === ALLOWED_EMAIL;
}

export type FileVisibility = "private" | "public";

export function isFileVisibility(value: string): value is FileVisibility {
  return value === "private" || value === "public";
}
