import bcrypt from "bcryptjs";
import crypto from "crypto";

const PEPPER = process.env.PASSWORD_PEPPER || "";

export async function hashPassword(password: string) {
  const salted = password + PEPPER;
  return bcrypt.hash(salted, 12);
}

export async function verifyPassword(password: string, hash: string) {
  const salted = password + PEPPER;
  return bcrypt.compare(salted, hash);
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
