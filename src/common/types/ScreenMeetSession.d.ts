import {AgentSession} from "./AgentSession";
import {AgentPrefOptions} from "./NewSessionOptions";
import {ScreenMeetSessionType} from "./Products";

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
  urls?: {
    user?: string,
    host?: string
  }
  userDescription: string
}