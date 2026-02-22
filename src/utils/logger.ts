// import { ENV } from "@/config/env";

type ApiLog = {
  url: string;
  method?: string;
  status?: number;
  ok?: boolean;
  durationMs?: number;
  note?: string;
};

export function logApi(_info: ApiLog) {
  // eslint-disable-next-line no-console
}
