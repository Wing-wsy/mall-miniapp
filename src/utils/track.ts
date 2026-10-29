import { reportTrackEvents, type TrackEventPayload } from "@/api/track";

const AID_KEY = "mall_track_aid";
const CHECKOUT_ENTRY_KEY = "mall_checkout_entry";
const VIEW_DEDUP_MS = 5 * 60 * 1000;
const QUEUE_MAX = 50;
const FLUSH_AT = 10;
const FLUSH_INTERVAL_MS = 5000;

const VIEW_EVENTS = new Set(["product_view", "combo_view"]);

type TrackProps = Record<string, unknown>;

interface QueuedEvent extends TrackEventPayload {
  clientTs: number;
  anonymousId: string;
}

const queue: QueuedEvent[] = [];
const viewLastAt = new Map<string, number>();
let flushing = false;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let retryOnce: QueuedEvent[] | null = null;

function uuidLite() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnonymousId() {
  try {
    const existing = String(uni.getStorageSync(AID_KEY) || "").trim();
    if (existing) {
      return existing;
    }
  } catch {
    // ignore
  }
  const id = uuidLite();
  try {
    uni.setStorageSync(AID_KEY, id);
  } catch {
    // ignore
  }
  return id;
}

export function markCheckoutEntry(entry: string) {
  try {
    uni.setStorageSync(CHECKOUT_ENTRY_KEY, entry);
  } catch {
    // ignore
  }
}

export function consumeCheckoutEntry(): string | null {
  try {
    const v = String(uni.getStorageSync(CHECKOUT_ENTRY_KEY) || "").trim();
    uni.removeStorageSync(CHECKOUT_ENTRY_KEY);
    return v || null;
  } catch {
    return null;
  }
}

function viewDedupKey(event: string, props?: TrackProps) {
  if (event === "product_view") {
    return `${event}:${props?.productId ?? ""}`;
  }
  if (event === "combo_view") {
    return `${event}:${props?.comboId ?? ""}`;
  }
  return event;
}

function shouldSkipView(event: string, props?: TrackProps) {
  if (!VIEW_EVENTS.has(event)) {
    return false;
  }
  const key = viewDedupKey(event, props);
  const now = Date.now();
  const last = viewLastAt.get(key) || 0;
  if (now - last < VIEW_DEDUP_MS) {
    return true;
  }
  viewLastAt.set(key, now);
  return false;
}

function ensureTimer() {
  if (flushTimer != null) {
    return;
  }
  flushTimer = setInterval(() => {
    if (queue.length) {
      void flush();
    }
  }, FLUSH_INTERVAL_MS);
}

export function track(event: string, props?: TrackProps) {
  if (!event) {
    return;
  }
  if (shouldSkipView(event, props)) {
    return;
  }
  ensureTimer();
  const item: QueuedEvent = {
    event,
    props: props && Object.keys(props).length ? { ...props } : undefined,
    clientTs: Date.now(),
    anonymousId: getAnonymousId(),
  };
  queue.push(item);
  while (queue.length > QUEUE_MAX) {
    queue.shift();
  }
  if (queue.length >= FLUSH_AT) {
    void flush();
  }
}

export async function flush() {
  if (flushing) {
    return;
  }
  const batch = retryOnce && retryOnce.length ? retryOnce.splice(0, retryOnce.length) : queue.splice(0, queue.length);
  retryOnce = null;
  if (!batch.length) {
    return;
  }
  flushing = true;
  try {
    await reportTrackEvents(batch);
  } catch {
    if (!retryOnce) {
      retryOnce = batch;
    }
  } finally {
    flushing = false;
  }
}
