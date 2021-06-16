import fetch from 'node-fetch';
import {ScreenMeetAPIError} from "./ScreenMeetAPIError";
import {MeResponse} from "./types/MeResponse";
import {NewSessionOptions} from "./types/NewSessionOptions";
import {SupportSession,SupportSessionListResult} from "./types/ScreenMeetSession";
import {SessionPaginationCriteria} from "./types/PaginationCriteria";
import {CobrowseDeployment,EndpointConfig} from "./types/ConfigTypes";
import {DiscoveryResponse} from "./types/DiscoveryResponse";
const debug = require('debug')('ScreenMeet:api');


const querystring = require('querystring');

/**
 * The ScreenMeetAPI class is your primary surface for performing operations on the ScreenMeet platform.
 * It provides API's to create, close, and monitor ScreenMeet sessions.
 */
export class ScreenMeetAPI {
  /** This is the key to interact with the ScreenMeet API. It is generally a user session token identifying the user */
  private key: string = '';

  /** The endpoint is the API URI prefix for which ScreenMeet API version to target. */
  private endpoint: string = 'https://api-v3.screenmeet.com/v3';

  /**
   * The ScreenMeetAPI constructor takes an optional API [[key]] as the 1st prameter parameter. It can also be set
   * later via [[setKey]]
   * @param key
   */
  constructor(key:string='') {
    if (key) {
      this.setKey(key);
    }
  }


  /**
   * This is a setter method to update the [[key]]
   * @param key
   */
  setKey = (key: string) => {
    this.key = key;
  }

  /**
   * This method returns information about the currently authenticated user. The response object is a {@link MeResponse}
   */
  me = async ():Promise<MeResponse> =>  {
    return this.get('/me');
  }

  /**
   * Clears the [[key]] from the {@link ScreenMeetAPI} instance and signals the back-end to end the agent session
   */
  signout = async ():Promise<any> =>  {
    let result;
    try {
      result = await this.get('/auth/signout');
    } catch (er) {}
    this.key = '';
    return result;
  }

  /**
   * This method creates a new {@link ScreenMeetSession} session of the desired {@link ScreenMeetSessionType}.
   *
   */
  createSession = async (params:NewSessionOptions):Promise<SupportSession> => {
    if (params.parentObject && !params.parentObject.provider) {
      params.parentObject.provider = 'webwidget'; //special case that will not cause a sync error
    }
    return await this.post('/supportsessions', params);
  }

  /**
   * This method will retreive a list of all new and active sessions that belong to the authenticated user.
   * @param params
   */
  listUserSessions = async (params:SessionPaginationCriteria= {"limit" : 20, "orderdir":"DESC", "orderby" : "createdAt","offset":0} ):Promise<SupportSessionListResult> => {
    return await this.get('/supportsessions', params);
  }

  /**
   * Returns a promise that resolves with an array of sessions associated with the related object mapping key
   * @param externalObjectMappingKey
   */
  listRelatedObjectSessions = async (externalObjectMappingKey: string):Promise<Array<SupportSession>> => {

      return this.get(`/crmlookup/${externalObjectMappingKey}`);

  }

  /**
   * Closes the session with the given alpha-numeric ID.
   * @param code
   */
  closeSession = async (code:string) : Promise<{"success" : boolean}> => {
    return await this.delete(`/supportsession/${code}`, {});
  }

  /**
   *
   */
  getSession = async (code:string) : Promise<SupportSession> => {
    return await this.get(`/supportsession/${code}`, {});
  }

  /**
   * Returns cobrowse deployments configuration for the organization
   * @param org_id
   */
  getCobrowseDeployments = async (org_id: number):Promise<Array<CobrowseDeployment>> => {
    return await this.get(`/organization/${org_id}/cobrowsedeployments`);
  }

  /**
   * Returns endpoint configurations for an organization
   * @param org_id
   */
  getEndpointsConfig = async (org_id: number):Promise<EndpointConfig> => {
    return await this.get(`/organization/${org_id}/remotewidgetconfig`);
  }

  /**
   * Exchanges an O-Auth authorization token for an access token on the back-end, establishes a user session,
   * and returns a user session {@link MeResponse} object.
   *
   * @param provider
   * @param session_token
   */

  public authWithOauthCode = (provider:string, code:string, instance_url?:string, state?:string):Promise<MeResponse> => {
    var params =  {code: code, instance_url: undefined, state: undefined};
    if (instance_url) {
      params.instance_url = instance_url;
    }
    if (state) {
      params.state = state;
    }
    return this.get(`/auth/${provider}/exchangeCode`, params)
  }

  /**
   * Authenticates the user with a session token
   * @param provider
   * @param session_token
   */

  public authWithToken = async (provider:string, session_token:string):Promise<MeResponse> => {

    var payload = {session_token: session_token};

    return await this.post(`/auth/${provider}/authWithToken`, payload);
  }

  /**
   * Returns configuration data for the given config
   * @param configTypeId
   */
  public getConfiguration = async (configTypeId) => {
    return await this.get(`/configuration/${configTypeId}`);
  }


  /**
   * Returns the API end-point base URL
   */
  public getBaseUrl = ():string => {
    return this.endpoint
  }

  /**
   * Changes the BASE API URL. Generally used to change to a pre-production ScreenMeet environment.
   * @param url
   */
  public setBaseUrl = (url):void => {
    this.endpoint = url;
  }

  /**
   * Polls the discovery service with a list of session ID's (max 20) and will return a {@link DiscoveryResponse}
   * which will include any sessions that have an active state
   * @param sessionIdList
   */
  public pollDiscoveryState = async (sessionIdList:Array<string>):Promise<DiscoveryResponse> => {
    return await this.get(`/discovery`, {'ids' : sessionIdList.join(',')});
  }

  private getDefaultHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Session-id': this.key,
      'client-app': 'screenmeet-js-sdk'
    }
  }

  private delete = async (path: string, params?: { [key: string]: any }) => {

    var options = {
      body: JSON.stringify(params),
      method: 'DELETE',
      url: this.getBaseUrl() + path,
      headers: this.getDefaultHeaders()
    }

    let fetchResult = await fetch(options.url, options);
    return await this.parseResponse(fetchResult, options);

  }

  private put = async (path: string, params?: { [key: string]: any }) => {

    var options = {
      body: JSON.stringify(params),
      method: 'PUT',
      url: this.getBaseUrl() + path,
      headers: this.getDefaultHeaders()
    }

    let fetchResult = await fetch(options.url, options);
    return await this.parseResponse(fetchResult, options);

  }


  private post = async (path: string, params?: { [key: string]: any }) => {

     var options = {
       body: JSON.stringify(params),
       method: 'POST',
       url: this.getBaseUrl() + path,
       headers: this.getDefaultHeaders()
     }

    let fetchResult = await fetch(options.url, options);
    return await this.parseResponse(fetchResult, options);

   }

  private get = async (path: string, params?: { [key: string]: any }) => {

    var options = {
      method: 'GET',
      url: this.getBaseUrl() + path + '?' + querystring.stringify(params),
      headers: this.getDefaultHeaders()
    };

    let fetchResult = await fetch(options.url, options);
    return await this.parseResponse(fetchResult, options);
  }


  parseResponse = async (response, options) => {
    if (response.status === 200) {
      return response.json()
    } else {
      let Err: ScreenMeetAPIError;

      if (response.status === 401) {
        Err = new ScreenMeetAPIError(`Your session has expired or you have signed out in another window`);
      } else {
        Err = new ScreenMeetAPIError(`HTTP ${response.status} ${response.statusText} while making API request`);
      }
      Err.response = response;
      Err.body = await response.text();
      Err.options = options;
      throw Err;
    }

  }


}
module.exports = {
  ScreenMeetAPI : ScreenMeetAPI
};