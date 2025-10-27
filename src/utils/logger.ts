import { ENV } from "@/config/env";

type ApiLog = {
  url: string;
  method?: string;
  status?: number;
  ok?: boolean;
  durationMs?: number;
  note?: string;
};

export function logApi(info: ApiLog) {
  if (!ENV.IS_DEVELOPMENT) return; // only log in development
  const { url, method = "GET", status, ok, durationMs, note } = info;
  const color = ok ? "#16a34a" : "#dc2626"; // green or red
  const parts = [
    `%cAPI%c ${method} %c${url}%c ${status ?? ""} ${durationMs ? `(${durationMs}ms)` : ""} ${note ?? ""}`,
    "background:#0ea5e9;color:#fff;padding:2px 4px;border-radius:3px",
    "",
    `color:${color}`,
    "",
  ];
  // eslint-disable-next-line no-console
  console.log(...(parts as Parameters<typeof console.log>));
}
