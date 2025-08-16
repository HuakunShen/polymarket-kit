import { treaty } from "@elysiajs/eden";
import type { App } from "./index";

export function createClient(url: string): ReturnType<typeof treaty<App>> {
  return treaty<App>(url);
}
