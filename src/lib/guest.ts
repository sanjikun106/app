const GUEST_KEY = "meetroute_guest_id";

export function getGuestId(): string {
  if (typeof window === "undefined") return "ssr-guest";
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}
