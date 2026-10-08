export interface MtcStageSchedule {
  stage: string;
  timings: string[]; // Chronologically sorted HH:MM times
}

export interface MtcRouteTimingsResponse {
  routeNo: string;
  lastUpdated: string;
  availableOrigins: string[];
  schedules: MtcStageSchedule[];
}
