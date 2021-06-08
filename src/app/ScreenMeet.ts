import {ScreenMeetAPI} from '../common/ScreenMeetAPI';
import {AuthCodeResponse} from "../common/types/AgentSession";
import {MeResponse} from "../common/types/MeResponse";
import { EventEmitter } from "events";
const debug = require('debug')('ScreenMeet');

/**
 * Options of initializing the screenmeet object
 */
export type ScreenMeetOptions = {
  persistSession?: boolean /** Whether to store session data in local storage. Data will be stored until the session expires. */
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
  public isAuthenticated = false;
  public me?:MeResponse;
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

    if (options.persistSession) {
      this.restoreMe();
    }


  }

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
  private onAuthenticated() {
    this.emit('authenticated', this.me);
    this.isAuthenticated = true;
    this.api.setKey(this.me.session.id);
    this.updateSessionExpireTime(); //this might log user out if session is expired
    if (this.isAuthenticated) {
      debug(`User [${this.me.user.name} ${this.me.user.externalId}] authenticated. Session expiration:` + this.sessionExpiresAfter);
      if(this.options.persistSession) {
        this.rememberMe();
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