import { UserRole } from "./AuthContext";

export type UserDirectoryEntry = {
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
};

const KEY = "hf_user_directory_v1";

const safeNormalize = (email: string) => email.toLowerCase().trim();

function readRaw(): UserDirectoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(entries: UserDirectoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function loadDirectory(): UserDirectoryEntry[] {
  return readRaw();
}

export function findEntry(email: string): UserDirectoryEntry | undefined {
  const norm = safeNormalize(email);
  return readRaw().find((e) => safeNormalize(e.email) === norm);
}

export function upsertEntry(entry: UserDirectoryEntry) {
  const norm = safeNormalize(entry.email);
  const list = readRaw().filter((e) => safeNormalize(e.email) !== norm);
  list.push({ ...entry, email: norm });
  writeRaw(list);
  return list;
}

export function deleteEntry(email: string) {
  const norm = safeNormalize(email);
  const list = readRaw().filter((e) => safeNormalize(e.email) !== norm);
  writeRaw(list);
  return list;
}
