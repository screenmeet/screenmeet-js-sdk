import {ScreenMeetAPI} from '../common/ScreenMeetAPI';
import {AuthCodeResponse} from "../common/types/AgentSession";
import {MeResponse} from "../common/types/MeResponse";

const debug = require('debug')('ScreenMeet');

/**
 * Options of initializing the screenmeet object
 */
export type ScreenMeetOptions = {
  persistSession?: boolean /** Whether to store session data in local storage. Data will be stored until the session expires. */
}

export default class ScreenMeet {
  public api: ScreenMeetAPI;
  private loginWindow: any;
  private windowWatcher: any;
  private loginPromise?: Promise<any>;
  private loginFail?: (er:Error) => void;
  private userDataKey?:string = 'screenmeetuser';
  public isAuthenticated = false;
  public me?:MeResponse;
  options: ScreenMeetOptions;
  constructor(options:ScreenMeetOptions={}) {
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
    this.isAuthenticated = true;
    this.api.setKey(this.me.session.id);
    if (this.options.persistSession) {
      this.rememberMe();
    }
  }

  public signout() {
    this.isAuthenticated = false;
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

  private clearUserData() {
    localStorage.removeItem(this.userDataKey);
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