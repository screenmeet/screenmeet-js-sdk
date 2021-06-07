import {ScreenMeetAPI} from '../common/ScreenMeetAPI';

export default class ScreenMeet {
  api: ScreenMeetAPI;
  instance: string;
  loginWindow: any;
  constructor(instance:string) {
    this.api = new ScreenMeetAPI();

  }

  login = (cburl:string) => {

    let authUrl = this.getAuthUrl('azure', 'https://localhost/durr');

    this.loginWindow = window.open(authUrl, 'sm_oauth', 'width=500,height=700');

    //@todo - implement as promise


  }

  getAuthUrl = (provider:string, cburl:string) => {

    return `${this.api.getBaseUrl()}/auth/${provider}/goToAuth?instance_url=${encodeURIComponent(this.instance)}&receiver_url=`
      + encodeURIComponent(cburl + '?')+encodeURIComponent('&login_intent_token') + '=' + this.getIntentToken();
  }

  getIntentToken = ( randomBytesLength = 32 ): string => {
    if ( typeof window === 'undefined' ) {
      return '';
    }
    let randomBytes: any;
    randomBytes = new Uint8Array( randomBytesLength );
    window.crypto.getRandomValues( randomBytes );
    let output = window.btoa( String.fromCharCode( ...randomBytes ) );
    window.localStorage.setItem('smLoginToken', output);
    return output.replace(/[\W]/g, '');
  }

}

//@ts-ignore
window.ScreenMeet = ScreenMeet;

module.exports = ScreenMeet;