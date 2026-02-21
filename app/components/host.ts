"use client";

const defaultBackend = "http://localhost:8000";

export const host =
  process.env.NEXT_PUBLIC_IS_STATIC === "true"
    ? ""
    : process.env.NEXT_PUBLIC_BACKEND_URL || defaultBackend;

export const public_path =
  process.env.NEXT_PUBLIC_IS_STATIC !== "true" ? "/" : "/static/";

export const getWebsocketHost = () => {
  if (process.env.NEXT_PUBLIC_IS_STATIC === "true") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const current_host = window.location.host;
    return `${protocol}//${current_host}/ws/`;
  }
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || defaultBackend;
  const protocol = base.startsWith("https") ? "wss:" : "ws:";
  const hostPart = base.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `${protocol}//${hostPart}/ws/`;
};
