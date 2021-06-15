import {ScreenMeetAPI} from '../common/ScreenMeetAPI';
import {AuthCodeResponse} from "../common/types/AgentSession";
import {MeResponse} from "../common/types/MeResponse";
import { EventEmitter } from "events";
import {ScreenMeetSessionType} from "../common/types/Products";
import {AgentPrefOptions, ParentObject} from "../common/types/NewSessionOptions";
import {ScreenMeetUrls, SupportSession, SupportSessionListResult} from "../common/types/ScreenMeetSession";
import {SessionPaginationCriteria} from "../common/types/PaginationCriteria";
import {EndpointConfig} from "../common/types/ConfigTypes";
import {DiscoveryResponse} from "../common/types/DiscoveryResponse";
const keyby = require('lodash.keyby');
const debug = require('debug')('ScreenMeet');

/**
 * Options of initializing the screenmeet object
 */
export type ScreenMeetOptions = {
  persistAuth?: boolean /** Whether to store session data in local storage. Data will be stored until the session expires. */
  trackSessionState?: boolean /** If this is true, the client will periodically poll for the state of the sessions */
  eventHandlers?: {
    authenticated?: (MeResponse) => void
    signout?: () => void
  }
}

export default class ScreenMeet extends EventEmitter {
  public api: ScreenMeetAPI;
  private loginWindow: any;
  private windowWatcher: any;
  private loginPromise?: Promise<any>;
  private loginFail?: (er:Error) => void;
  private userDataKey?:string = 'screenmeetuser';
  private sessionExpiresAfter?:Date; /** Date when current session is no longer valid */
  public endpoints?: EndpointConfig;
  public isAuthenticated = false;
  public me?:MeResponse;
  public trackedSessions?: {[id:string]:SupportSession};
  private refreshMethod: () => Promise<any>;
  private lastDiscoveryResult:string='';
  private discoveryIntervalMs:number = 15000;
  private discoveryInterval:any=null;
  private trackedSessionIdList?: Array<string>;

  options: ScreenMeetOptions;
  constructor(options:ScreenMeetOptions={}) {
    super();
    if (options && options.eventHandlers) {
      for (let handler in options.eventHandlers) {
        debug(`Binding handler ${handler} from constructor options eventHandlers`);
        this.on(handler, options.eventHandlers[handler]);
      }
    }
    this.api = new ScreenMeetAPI();
    this.options = options;
    if (this.options.trackSessionState) {
      this.discoveryInterval = setInterval(this.pollSessionDiscovery, this.discoveryIntervalMs);
    }


  }

  /**
   * Initialize authentication / etc.
   */
  init() {
    if (this.options.persistAuth) {
      this.restoreMe();
    }
  }

  /**
   * Opens an authentication dialog with the desired provider / instance. Returns a promise with a {@link MeResponse}
   * after a successful authentication. Will reject if the auth window is closed or if there is an error.
   * @param provider
   * @param cburl
   * @param instance
   */
  login = (provider: string, cburl:string, instance:string): Promise<MeResponse> =>  {

    debug(`Attempting to log in [provider: ${provider} cb: ${cburl} instance:${instance}`);

    let authUrl = this.getAuthUrl(provider, cburl, instance);

    //fail previous promise
    if (this.loginFail) {
      this.loginFail(new Error('Restarted login process'));
      this.loginFail = null;
    }
    //clear old window watcher
    if (this.loginWindow) {
      clearInterval(this.windowWatcher);
    }

    //open new window
    this.loginWindow = window.open(authUrl, 'sm_oauth', 'width=500,height=700');

    //set up new watcher
    this.windowWatcher = setInterval(() => {
      if (this.loginWindow.closed) {
        clearInterval(this.windowWatcher);
        if (this.loginFail) {
          this.loginFail(new Error('Window was closed before completing auth process'));
        }
      }
    }, 1000);

    //create new promise
    this.loginPromise = new Promise((resolve, reject) => {
      this.loginFail = reject;

      //@ts-ignore
      window._sm_oauth_cb = async (authData:AuthCodeResponse) => {
        clearInterval(this.windowWatcher);
        this.loginFail = null;

        let expectedToken = localStorage.getItem('smLoginToken');
        if (authData.login_intent_token !== expectedToken) {
          reject(new Error(`Login intent token does not match ${expectedToken} : ${authData.login_intent_token}`));
          return;
        }

        let me:MeResponse = await this.api.authWithOauthCode(provider, authData.code, instance);

        debug(`Received login user data`)

        this.me = me;
        this.onAuthenticated();
        this.loginWindow.close();
        resolve(me);

      };
    });
    return this.loginPromise;
  }

  /**
   * Creates a session that is not associated with any external object.
   *
   * @param type
   * @param label
   * @param prefs
   * @param userDescription - The alias to use for the creator of the session. If not used, the user name will be used.
   */
  createAdhocSession = async (type: ScreenMeetSessionType, label: string, prefs: AgentPrefOptions={}, userDescription?:string): Promise<SupportSession> => {
    if (!this.isAuthenticated) { throw new Error('User must be authenticated to create new sessions.')}

    let options = {
      userDescription: userDescription ? userDescription : this.me.user.name,
      agentPrefs: prefs,
      type: type,
      label: label
    };

    return await this.api.createSession(options);

  }

  /**
   * Creates a session that is not associated with any external object.
   *
   * @param type
   * @param label
   * @param prefs
   * @param parentObject A {@link ParentObject} describing the related object. This is used to perform data synchronization.
   * @param externalMapping - This should be a globally unique string identifying the parent object. eg: myservicename.myinstance.myobject.id (spiffycrm.acmebrand.case.g4j231j8f).
   * @param userDescription - The alias to use for the creator of the session. If not used, the user name will be used.
   */
  createRelatedSession = async (type: ScreenMeetSessionType,
                                label: string,
                                prefs: AgentPrefOptions={},
                                parentObject:ParentObject,
                                externalMapping:string,
                                userDescription?:string ): Promise<SupportSession> => {
    if (!this.isAuthenticated) { throw new Error('User must be authenticated to create new sessions.')}

    let options = {
      userDescription: userDescription ? userDescription : this.me.user.name,
      agentPrefs: prefs,
      type: type,
      label: label,
      externalMapping: externalMapping,
      parentObject: parentObject
    };

    return await this.api.createSession(options);

  }

  /**
   * Closes / ends the session with a given ID.
   * @param id
   */
  async closeSession (id:string): Promise<void> {
    if (!this.isAuthenticated) { throw new Error('User must be authenticated to close sessions.')}

    await this.api.closeSession(id);
  }

  /**
   * Returns a list of new or active sessions created by this user.
   *
   * @param params
   */
  listUserSessions = async (params:SessionPaginationCriteria):Promise<SupportSessionListResult> => {
    let result = await this.api.listUserSessions(params);
    if (this.options.trackSessionState) {
      this.updateTrackedSessionList(result.rows);
      //sets the method to use to refresh the current session list after polling
      this.refreshMethod = async () => { return this.listUserSessions(params); }
    }
    return result;
  }

  /**
   * Returns a promise that resolves with an array of sessions associated with the related object mapping key
   * @param externalObjectMappingKey
   */
  listRelatedObjectSessions = async (externalObjectMappingKey:string):Promise<Array<SupportSession>> => {
    let result = await this.api.listRelatedObjectSessions(externalObjectMappingKey);
    if (this.options.trackSessionState) {
      this.updateTrackedSessionList(result);
      //sets the method to use to refresh the current session list after polling
      this.refreshMethod = async () => { return this.listRelatedObjectSessions(externalObjectMappingKey); }
    }
    return result;
  }

  /**
   *
   * @param sessions
   */
  private updateTrackedSessionList = (sessions:Array<SupportSession>) => {
    //updating tracked list
    let sessionsToTrack = keyby(sessions, 'id');
    this.trackedSessions = sessionsToTrack;
    this.trackedSessionIdList = Object.keys(this.trackedSessions);

    this.emit('updated',this.trackedSessions);

    debug('Updated tracked sessions. Current list:', this.trackedSessions, 'idlist', this.trackedSessionIdList);

  }

  /**
   * Restores a user session details from local storage
   */
  private restoreMe() {
    debug('attempting to restore user session');
    let sessionJson = localStorage.getItem(this.userDataKey);

    if (sessionJson) {
      debug(`found user data in key ${this.userDataKey}`);
      this.me = JSON.parse(sessionJson);
      if (!this.me) {
        this.clearUserData();
        return;
      }
      this.onAuthenticated();
      debug('restored user data', this.me);
    } else {
      debug('no stored user session found');
    }
  }

  /**
   * Runs after a user is successfully authenticated
   */
  private async onAuthenticated() {
    this.isAuthenticated = true;
    this.api.setKey(this.me.session.id);
    this.updateSessionExpireTime(); //this might log user out if session is expired
    if (this.isAuthenticated) {
      debug(`User [${this.me.user.name} ${this.me.user.externalId}] authenticated. Session expiration:` + this.sessionExpiresAfter);
      if(this.options.persistAuth) {
        this.rememberMe();
      }
      await this.loadEndpointConfig();
    }
    this.emit('authenticated', this.me);
  }

  /**
   * Ensures the latest endpoint configurations are loaded. These are used to construct various URL's for different
   * session types
   */
  async loadEndpointConfig() {
    if (!this.isAuthenticated) {
      throw new Error('Cannot load endpoints while not authenticated');
    }
    this.endpoints = await this.api.getEndpointsConfig(this.me.org.id)
  }

  public getUrls (session:SupportSession):ScreenMeetUrls {
    if (!this.endpoints) {
      throw new Error(`Cannot create ScreenMeet URLs before endpoint config is loaded`);
    }

    const conf = this.endpoints.widgetConfig;

    switch (session.type) {
      case "support":
        return {
          "invite" : `${conf.activation_base_url}/${session.pin}`,
          "host" : `${conf.viewer_base_url}?${session.id}#token=${encodeURIComponent(this.me.session.id)}`,
          "vanity" : `${conf.vanity_url}`
        }
      case "cobrowse":
        return {}
      case "live":
        return {
          "invite" : `${conf.live_url}?${session.id}`,
          "host" : `${conf.live_url}?${session.id}#token=${encodeURIComponent(this.me.session.id)}`,
          "vanity" : `${conf.vanity_url}`
        }
      case "replay":
        return {
          "invite" : `${conf.replay_url}${session.id}`
        }
    }
  }

  public signout() {

    this.api.signout();
    this.clearUserData();
  }

  /**
   * Stores information about the authenticated user in a localStorage var
   */
  private rememberMe() {
    let userjson = JSON.stringify(this.me);
    debug(`Storing user session JSON in key ${this.userDataKey}:`, this.me)
    localStorage.setItem(this.userDataKey, userjson);
  }

  /**
   * Removes any stored user session data from this object
   */
  private clearUserData() {
    this.emit('signout');
    this.isAuthenticated = false;
    this.me = null;
    this.api.setKey(null);
    localStorage.removeItem(this.userDataKey);
    debug('User data cleared');
  }

  private updateSessionExpireTime() {
    if (this.me) {
      this.sessionExpiresAfter = new Date(this.me.session.expiresAt);
      if (this.sessionExpiresAfter.getTime() < Date.now()) {
        debug('User session has expired');
        this.clearUserData();
      }
    }
  }

  pollSessionDiscovery = async () => {
    debug('[pollSessionDiscovery] Starting to poll for session state changes');
    let shouldRefresh = false;
    if (!this.trackedSessionIdList) {
      debug('[pollSessionDiscovery] no sessions to track')
      return;
    }
    let disco = await this.api.pollDiscoveryState(this.trackedSessionIdList);
    let discoJSON = JSON.stringify(disco);

    if (this.lastDiscoveryResult && this.lastDiscoveryResult !== discoJSON) {
      debug('[pollSessionDiscovery] Discovery results changed, should refresh');
      shouldRefresh = true;
    } else if (!this.lastDiscoveryResult) {
      debug('[pollSessionDiscovery] first poll result processing');
      for (let sessionId in disco) {
        if (this.trackedSessions[sessionId] && this.trackedSessions[sessionId].status !== 'active') {
          debug(`[pollSessionDiscovery] status of session on first poll is active for ${sessionId} - should refresh`);
          shouldRefresh = true;
        }
      }
    }


    this.lastDiscoveryResult = discoJSON;

    if (shouldRefresh) {
      debug(`[pollSessionDiscovery] SHOULD REFRESH`);
    }



  }


  private getAuthUrl = (provider:string, cburl:string, instance:string) => {
    return `${this.api.getBaseUrl()}/auth/${provider}/goToAuth?instance_url=${encodeURIComponent(instance)}&receiver_url=`
      + encodeURIComponent(cburl + '?')+encodeURIComponent('&login_intent_token') + '=' + this.getIntentToken();
  }

  private getIntentToken = ( randomBytesLength = 32 ): string => {
    if ( typeof window === 'undefined' ) {
      return '';
    }
    let randomBytes: any;
    randomBytes = new Uint8Array( randomBytesLength );
    window.crypto.getRandomValues( randomBytes );
    let output = window.btoa( String.fromCharCode( ...randomBytes ) ).replace(/[\W]/g, '');
    window.localStorage.setItem('smLoginToken', output);
    return output;
  }

}

//@ts-ignore
window.ScreenMeet = ScreenMeet;

module.exports = ScreenMeet;