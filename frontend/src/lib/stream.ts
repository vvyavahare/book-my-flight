// Generic Server-Sent Events (SSE) helper. The admin dashboard subscribes to the live
// booking feed directly with `EventSource` (see src/app/admin/page.tsx); this helper
// offers a small reusable shape for other future streams (e.g. live seat availability).

import { API_BASE_URL, getToken } from "./api";

export type StreamHandler = (data: unknown) => void;

/**
 * Subscribe to an SSE endpoint on the gateway. The JWT is passed as an `access_token`
 * query param because browser `EventSource` cannot set request headers. Returns an
 * unsubscribe function that closes the connection.
 */
export function subscribe(
  path: string,
  onMessage: StreamHandler,
  eventName = "message",
): () => void {
  const token = getToken();
  const params = new URLSearchParams();
  if (token) params.set("access_token", token);
  const url = `${API_BASE_URL}${path}?${params.toString()}`;

  const source = new EventSource(url);
  const listener = (e: MessageEvent) => {
    try {
      onMessage(JSON.parse(e.data));
    } catch {
      onMessage(e.data);
    }
  };
  source.addEventListener(eventName, listener as EventListener);

  return () => source.close();
}
