import {AgentSession} from "./AgentSession";
import {AgentPrefOptions} from "./NewSessionOptions";
import {ScreenMeetSessionType} from "./Products";
import {PaginatedResult} from "./PaginationCriteria";

interface SupportSessionListResult extends PaginatedResult{
  rows: Array<SupportSession>
}

export type SupportSessionUrls = {
  "invite" : string /** The invite URL should be sent to the user for them to join the session via a support native client */
  "host" : string /** The host URL can be opened for the agent to join the session once it is active. Please note that this URL contains an authentication token, and as such, should not be presented to the user where it can be easily copy/pasted. We recommend using window.open from the UI. */
  "vanity" : string /** The vanity URL is a landing page which will ask the user to enter a PIN to join the session  */
}

export type CobrowseUrls = {
  "host" : string /** The host URL can be opened for the agent to join the session once it is active. Please note that this URL contains an authentication token, and as such, should not be presented to the user where it can be easily copy/pasted. We recommend using window.open from the UI. */
  "invite"?:string /** The deployment URL entrypoint if configured, pre-configured with a pin */
  "allcbdeployments"?:Array<string> /** If there are multiple deployment entry URL's will be here, all deployments will be here */
}

export type LiveUrls = {
  "invite" : string /** The invite URL should be sent to the user for them to join the session via a support native client */
  "host" : string /** The host URL can be opened for the agent to join the session once it is active. Please note that this URL contains an authentication token, and as such, should not be presented to the user where it can be easily copy/pasted. We recommend using window.open from the UI. */
  "vanity" : string /** The vanity URL is a landing page which will ask the user to enter a PIN to join the session  */
}

export type ReplayUrls = {
  "invite" : string
}

export type ScreenMeetUrls = SupportSession | CobrowseUrls | LiveUrls | ReplayUrls;

export type SupportSession = {
  ExternalUserId: number
  OrganizationId: number
  createdAt: string
  createdByAgentSession: AgentSession
  expiresAt: string
  hostAuthToken: string
  id: string
  label: string
  pin: number
  scheduled: boolean
  settings: AgentPrefOptions
  status: "new" | "scheduled" | "active" | "closed"
  type: ScreenMeetSessionType
  unattended: boolean
  updatedAt: string
  userDescription: string
}



