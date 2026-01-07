import type { HandlerEvent } from "@netlify/functions";
import cookie from "cookie";

export function json(statusCode: number, body: any, headers: Record<string, string> = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

export function readJson<T>(event: HandlerEvent): T {
  if (!event.body) throw new Error("Missing body");
  return JSON.parse(event.body) as T;
}

export function getCookies(event: HandlerEvent) {
  const raw = event.headers.cookie || event.headers.Cookie || "";
  return cookie.parse(raw || "");
}

export function setCookieHeader(name: string, value: string, opts: cookie.CookieSerializeOptions) {
  return { "Set-Cookie": cookie.serialize(name, value, opts) };
}

export function clearCookieHeader(name: string) {
  return {
    "Set-Cookie": cookie.serialize(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.AUTH_COOKIE_SECURE === "true",
      path: "/",
      expires: new Date(0),
    }),
  };
}
