export type Products = {
  live: { knock: boolean, record: boolean, audio: boolean },
  cobrowse: { record: boolean },
  support: { record: boolean, prerequestrc: boolean, prerequestadmin: boolean },
  replay: {},
  beam: {}
}

export enum ScreenMeetSessionType {
  "support" = "support",
  "cobrowse" = "cobrowse",
  "live" = "live" ,
  "replay" = "replay"
}