import {AgentSession,ScreenAgentMeetRoles} from "./AgentSession";
import {Products} from "./Products";

export type ScreenMeetOrg = {
  provider: string,
  name: string,
  externalId: string,
  id: number,
  CustomerId: number
};

export type ScreenMeetUser = {
  name: string,
  email: string,
  externalId: string,
  id: number
};

export type MeResponse = {
  session: AgentSession,
  roles: ScreenAgentMeetRoles,
  org: ScreenMeetOrg,
  user: ScreenMeetUser,
  products: Products
};

