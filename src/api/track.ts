import { request } from "@/utils/request";

export interface TrackEventPayload {
  event: string;
  props?: Record<string, unknown>;
  clientTs?: number;
  anonymousId?: string;
}

export function reportTrackEvents(events: TrackEventPayload[]) {
  return request<{ accepted: number }>({
    url: "/api/app/track/events",
    method: "POST",
    data: { events },
    silent: true,
  });
}
