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
  "id": 1303,
  "key": "TtgpR",
  "name": "TerryTest",
  "OrganizationId": 265,
  "entrypoint": "https://localhost.screenmeet.com:8082/prod.html",
  "is_multidomain": false,
  "createdAt": "2020-10-28T18:16:38.000Z",
  "updatedAt": "2020-10-28T18:16:38.000Z",
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
    "viewer_base_url": "https://integration.screenmeet.com/viewer/index.html",
    /** The base URL for the remote-support landing page for end-users */
    "activation_base_url": "https://myhelpscreen.com/",
    /** The vanity URL that can be given to users by phone to enter their PIN to enter the session */
    "vanity_url": "myhelpscreen.com",
    /** The agent UI base interface */
    "agent_portal_base_url": "https://console.screenmeet.com/",
    /** The base Replay URL used to construct links for end-users */
    "replay_url":"https://replay-qa.screenmeet.com/"
    /** The base Live URL used to construct links for end-users and agents */
    "live_url": "https://live.screenmeet.com/",
    /** The embedded live URL that can be used to embed the meeting join experience */
    "embedded_live_url": "https://live.screenmeet.com/"
  }
}