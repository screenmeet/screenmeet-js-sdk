export type Products = {
  live: { knock: boolean, record: boolean, audio: boolean },
  cobrowse: { record: boolean },
  support: { record: boolean, prerequestrc: boolean, prerequestadmin: boolean },
  replay: {},
  beam: {}
}

export type ScreenMeetSessionType = "support" | "cobrowse" | "live" | "replay"