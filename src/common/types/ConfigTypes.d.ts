export type CobrowseDomain = {
  "id": number,
  "domain": string,
  "CobrowseDeploymentId": number,
  "OrganizationId": number,
  "is_validated": boolean,
  "is_entrypoint": boolean,
  "createdAt": string,
  "updatedAt": string
}

export type CobrowseDeployment = {
  "id": number,
  "key": string,
  "name": string,
  "OrganizationId": number,
  "entrypoint": string,
  "is_multidomain": false,
  "createdAt": string,
  "updatedAt": string,
  "CobrowseDomains": Array<CobrowseDomain>
}

export type EndpointConfig = {
  "widgetConfig" : {
    /** Is remote support enabled for the org */
    "remote_support": true,
    /** Is cobrowse enabled for the org */
    "cobrowse": true,
    /** Is live enabled for the org */
    "live": true,
    /** Is replay enabled for the org */
    "replay" : true,
    /** The base URL for the remote-support viewer user interface */
    "viewer_base_url": string,
    /** The base URL for the remote-support landing page for end-users */
    "activation_base_url": string,
    /** The vanity URL that can be given to users by phone to enter their PIN to enter the session */
    "vanity_url": string,
    /** The agent UI base interface */
    "agent_portal_base_url": string,
    /** The base Replay URL used to construct links for end-users */
    "replay_url":string
    /** The base Live URL used to construct links for end-users and agents */
    "live_url": string,
    /** The embedded live URL that can be used to embed the meeting join experience */
    "embedded_live_url": string
  }
}