export type ScreenAgentMeetRoles = {
  agent?: boolean,
  supervisor?: boolean,
  group_admin?: boolean,
  sysdamin?: boolean,
  manage_orgs?: boolean,
  manage_users?: boolean,
  manage_admins?: boolean,
  manage_servers?: boolean,
  manage_licenses?: boolean,
  manage_clientdist?: boolean,
  manage_config_types?: boolean,
  manage_configurations?: boolean,
  manage_file_asset_types?: boolean
}

export type ScreenMeetFeatures = null | {
  [feature_name:string] : boolean
}

export type AgentSession = {
  id: string;
  sid: number;
  ExternalUserId: number,
  OrganizationId: number,
  provider: string,
  providerExternalId: string,
  name: string,
  CustomerId: number,
  startedAt: string,
  expiresAt: string,
  lastActiveAt: string,
  isActive: true,
  clientApp: null | string,
  userAgent: string,
  remoteIp: string,
  createdAt: string,
  updatedAt: string,
  roles: ScreenAgentMeetRoles,
  features: ScreenMeetFeatures,
}

export type AuthCodeResponse = {
  code: string,
  login_intent_token: string,
  success: "true" | "false"
}
