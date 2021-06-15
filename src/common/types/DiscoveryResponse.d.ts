import {ScreenMeetSessionType} from "./Products";

export type DiscoveryResponse = {
  [key:string] : {
    id: string
    type: ScreenMeetSessionType
    ts: number,
    servers: {
      [serverType in ScreenMeetSessionType] : {
        region: string
        endpoint: string
        serverInstanceId: string
      }
    }
  }
}