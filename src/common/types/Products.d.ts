/**
 * This type describes the possible product entitlements as well as per-session options which can be sent as agent
 * preferences. These will depend on the product featuer configurations.
 */
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
/**
 * An option used for building a UI to collect agent preferences for initialization features when creating a
 * new session
 */
export type AgentPrefProductOptions = {
  "name" : string,
  "label" : string
}