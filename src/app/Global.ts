/**
 * This is a ScreenMeet globals class. It provides data and that can be consumed by multiple widgets on the window
 * at once, such as authentication and configuration data.
 *
 */
import { EventEmitter } from "events";
import {MeResponse} from "../common/types/MeResponse";
import {ScreenMeetAPI} from "../common/ScreenMeetAPI";
import {CobrowseDeployment, EndpointConfig} from "../common/types/ConfigTypes";
import {AuthCodeResponse} from "../common/types/AgentSession";
import ScreenMeet, {ScreenMeetOptions} from "./ScreenMeet";
import {DiscoveryResponse} from "../common/types/DiscoveryResponse";

const debug = require('debug')('ScreenMeet:Global');

export default class Global extends EventEmitter{

  public isAuthenticated = false;
  public api: ScreenMeetAPI;
  public me?:MeResponse;
  public options: ScreenMeetOptions;
  public endpoints?: EndpointConfig;
  public cbdeployments?: Array<CobrowseDeployment>;

  public instances: {[key:string]:ScreenMeet}={};
  private lastDiscoveryState: DiscoveryResponse={};
  //private discoverySessionIds:  { [sessionId:string]:string }; //list of tracked discovery sessions
  private discoveryIntervalMs:number = 15000;
  private discoveryInterval:any=null;
  private userDataKey?:string = 'screenmeetuser';
  private sessionExpiresAfter?:Date; /** Date when current session is no longer valid */
  private loginWindow: any;
  private windowWatcher: any;
  private loginPromise?: Promise<any>;
  private loginFail?: (er:Error) => void;


  constructor(options) {
    super();
    this.api = new ScreenMeetAPI();
    this.options = options;
    if (this.options.api_endpoint) {
      this.api.setBaseUrl(this.options.api_endpoint);
    }
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
   * Signs the user out
   */
  public signout() {
    this.emit('signout');
    this.api.signout();
    this.clearUserData();
    clearInterval(this.discoveryInterval);
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


  /**
   * Returns the authentication end-point URL to sign in with the front end.
   *
   * @param provider
   * @param cburl - the callback URL file which will receive auth data. Must be an authorized URL.
   * @param instance
   */
  private getAuthUrl = (provider:string, cburl:string, instance:string) => {
    return `${this.api.getBaseUrl()}/auth/${provider}/goToAuth?instance_url=${encodeURIComponent(instance)}&receiver_url=`
      + encodeURIComponent(cburl + '?')+encodeURIComponent('&login_intent_token') + '=' + this.getIntentToken();
  }

  /**
   *
   */
  private updateSessionExpireTime() {
    if (this.me) {
      this.sessionExpiresAfter = new Date(this.me.session.expiresAt);
      if (this.sessionExpiresAfter.getTime() < Date.now()) {
        debug('User session has expired');
        this.clearUserData();
      }
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

      let loadConfigs = [this.loadEndpointConfig()];
      if (this.options.cbdeployments) {
        loadConfigs.push(this.loadCobrowseDeployments());
      }

      await Promise.all(loadConfigs);
      this.discoveryInterval = setInterval(this.pollSessionDiscovery, this.discoveryIntervalMs);
    }
    this.emit('authenticated', this.me);
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
   * Creates an intent token which must match the response. CSRF security measure.
   * @param randomBytesLength
   */
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

  async loadCobrowseDeployments() {
    if (!this.isAuthenticated) {
      throw new Error('Cannot load cobrowse deployments while not authenticated');
    }
    this.cbdeployments = await this.api.getCobrowseDeployments(this.me.org.id);
  }

  /**
   * Tracks the widget instance from the global - used for polling and other kind of global ops possibly.
   * @param instance
   */
  public registerForPolling(instance:ScreenMeet) {
    this.instances[instance.instance_id] = instance;
    debug(`[Global] Registered widget instance ${instance.instance_id}`);
  };

  public unregisterFromPolling(instance:ScreenMeet) {
    delete this.instances[instance.instance_id];
    debug(`[Global] UnRegistered widget instance ${instance.instance_id}`);
  };

  pollSessionDiscovery = async () => {
    debug('[pollSessionDiscovery] Starting to poll for session state changes');
    let shouldRefresh = false;

    //gather ID's
    let idsToPoll = [];
    for (let wid in this.instances) {
      let ids = this.instances[wid].trackedSessionIdList;
      idsToPoll = idsToPoll.concat(ids);
    }
    //dedupe
    let idSet = new Set(idsToPoll);
    let uniqueIds = [...idSet];

    if (!uniqueIds.length) {
      debug('[pollSessionDiscovery] no sessions to track')
      return;
    } else {
      debug(`[pollSessionDiscovery] polling ${uniqueIds.length} sessions for activity ${uniqueIds.join(',')}`);
    }

    let disco = await this.api.pollDiscoveryState(uniqueIds);

    for (let sid in disco) {
      if (!this.lastDiscoveryState[sid]) {
        //if we didn't have it in our result from last poll, then we emit it as newly active
        this.emit('discovery', sid, true);
      }
    }

    for (let sid in this.lastDiscoveryState) {
      if (!disco[sid]) {
        //the result was in our previous result set, but not in the current discovery, which means it went away
        this.emit('discovery', sid, false);
      }
    }

    this.lastDiscoveryState = disco;

//     if (shouldRefresh) {
//       debug(`[pollSessionDiscovery] SHOULD REFRESH`);
//     }
  }



}