// Placeholder for a future real-time channel (WebSocket / SSE), e.g. live seat
// availability or booking status updates. Wired to the gateway when that lands.
//
// Example (future):
//   const es = subscribe(`/api/bookings/${id}/stream`, (msg) => { ... });
//
// For now this only documents the intended shape so the UI can adopt it later.

export type StreamHandler = (data: unknown) => void;

export function subscribe(path: string, onMessage: StreamHandler): () => void {
  // Intentionally a no-op placeholder. A future implementation could use:
  //   const source = new EventSource(`${API_BASE_URL}${path}`);
  //   source.onmessage = (e) => onMessage(JSON.parse(e.data));
  //   return () => source.close();
  void path;
  void onMessage;
  return () => {};
}
