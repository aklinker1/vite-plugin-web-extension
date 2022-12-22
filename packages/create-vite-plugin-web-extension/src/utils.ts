import { ofetch } from "ofetch";

export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export async function fetchJson<T>(url: string): Promise<T> {
  return ofetch<T>(url, { parseResponse: JSON.parse });
}
