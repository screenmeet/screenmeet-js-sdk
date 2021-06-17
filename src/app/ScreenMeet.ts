import {ScreenMeetAPI} from '../common/ScreenMeetAPI';
import {AuthCodeResponse} from "../common/types/AgentSession";
import {MeResponse} from "../common/types/MeResponse";
import { EventEmitter } from "events";
import {ScreenMeetSessionType} from "../common/types/Products";
import {AgentPrefOptions, ParentObject} from "../common/types/NewSessionOptions";
import {ScreenMeetUrls, SupportSession, SupportSessionListResult} from "../common/types/ScreenMeetSession";
import {SessionPaginationCriteria} from "../common/types/PaginationCriteria";
import {DiscoveryResponse} from "../common/types/DiscoveryResponse";
import {Global} from "./Global";
const keyby = require('lodash.keyby');
const debug = require('debug')('ScreenMeet:main');




/**
 * Options of initializing the screenmeet object
 */
export type ScreenMeetOptions = {
  persistAuth?: boolean /** Whether to store session data in local storage. Data will be stored until the session expires. */
  trackSessionState?: boolean /** If this is true, the client will periodically poll for the state of the sessions */
  mode: 'object' | 'adhoc',
  cbdeployments?: boolean, /** Whether {@link CobrowseDeployment}s should be loaded (for cobrowse customers only) */
  api_endpoint?:string;
  eventHandlers?: {
    authenticated?: (MeResponse) => void
    signout?: () => void
  }
}

/**
 * This is a browser-only class.
 * Creates a ScreenMeet object which can be used to render session information to an UI.
 * Will automatically intantiate a {@link Global} instance when constructed
 */
export class ScreenMeet extends EventEmitter {
  public api: ScreenMeetAPI;

  public destroyed=false;
  public instance_id = Math.random().toString(36).substr(2, 5);
  public trackedSessions?: {[id:string]:SupportSession} = {};
  private lastDiscoveryResult:string='';
  public trackedSessionIdList?: Array<string>=[];
  public global : Global;

  public options: ScreenMeetOptions;


  constructor(options:ScreenMeetOptions={'mode' : 'adhoc'}) {
    super();

    this.options = options;

    //Singleton initialization for auth provider
    if (!window["SMGlobal"]) {
      debug('Creating SM Global singleton');
      window["SMGlobal"] = new Global(this.options);
    } else {
      debug('Creating SM Global singleton already initialized');
    }

    this.global = window["SMGlobal"];
    this.api = this.global.api;

    //proxy events from global to instance level
    this.global.on('authenticated', this.onAuthenticated);
    this.global.on('signout', this.onSignout);
    this.global.on('discovery', this.onDiscovery);

    debug(`Constructing new widget ${this.instance_id} - global auth is: ${this.global.isAuthenticated}`);

    if (options && options.eventHandlers) {
      for (let handler in options.eventHandlers) {
        debug(`Binding handler ${handler} from constructor options eventHandlers`);
        this.on(handler, options.eventHandlers[handler]);
      }
    }
    if (this.options.trackSessionState) {
      this.global.registerForPolling(this);
    }
    //if we are already globally authenticated when this instance is being created
    if (this.global.isAuthenticated) {
      this.onAuthenticated(this.global.me);
    }
  }



  /**
   * Opens an authentication dialog with the desired provider / instance. Returns a promise with a {@link MeResponse}
   * after a successful authentication. Will reject if the auth window is closed or if there is an error.
   * @param provider
   * @param cburl
   * @param instance
   */
  signin = (provider: string, cburl:string, instance:string): Promise<MeResponse> =>  {

    return window["SMGlobal"].signin(provider, cburl, instance);

  }

  /**
   * Emits authenticated event at the instance level
   * @param me
   */
  onAuthenticated = (me:MeResponse) => {
    this.emit('authenticated', me);
  }

  /**
   * Emits a signout event at the instance level
   */
  onSignout = () => {
    debug('emitting signout at local instance')
    this.emit('signout');
  }

  /**
   * Peforms a global signout
   */
  signout = () => {
    this.global.signout();
  }

  /**
   * Syntactic sugar accessor method
   */
  isAuthenticated = () => {
    return this.global.isAuthenticated && !this.destroyed;
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
    if (!this.isAuthenticated()) { throw new Error('User must be authenticated to create new sessions.')}
    if (this.options.mode !== 'adhoc') { throw new Error(`Cannot create an adhoc session while in ${this.options.mode} mode`)}

    let options = {
      userDescription: userDescription ? userDescription : this.global.me.user.name,
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
    if (!this.isAuthenticated()) { throw new Error('User must be authenticated to create new sessions.')}
    if (this.options.mode !== 'object') { throw new Error(`Cannot create a related session while in ${this.options.mode} mode`)}

    let options = {
      userDescription: userDescription ? userDescription : this.global.me.user.name,
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
    if (!this.isAuthenticated()) { throw new Error('User must be authenticated to close sessions.')}

    await this.api.closeSession(id);
  }

  /**
   * Returns a list of new or active sessions created by this user.
   *
   * @param params
   */
  listUserSessions = async (params:SessionPaginationCriteria):Promise<SupportSessionListResult> => {
    if (this.options.mode !== 'adhoc') { throw new Error(`Cannot list user sessions while in ${this.options.mode} mode`)}
    let result = await this.api.listUserSessions(params);
    if (this.options.trackSessionState) {
      this.updateTrackedSessionList(result.rows);
    }
    return result;
  }

  /**
   * Returns a promise that resolves with an array of sessions associated with the related object mapping key
   * @param externalObjectMappingKey
   */
  listRelatedObjectSessions = async (externalObjectMappingKey:string):Promise<Array<SupportSession>> => {
    if (this.options.mode !== 'object') { throw new Error(`Cannot list related sessions while in ${this.options.mode} mode`)}
    let result = await this.api.listRelatedObjectSessions(externalObjectMappingKey);
    if (this.options.trackSessionState) {
      this.updateTrackedSessionList(result);
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
   * Triggered when discovery polling detects a change in the session state
   * @param sessionId
   * @param stateActive
   */
  private onDiscovery = async (sessionId:string, stateActive:boolean) => {
    if (this.trackedSessions[sessionId]) {
      if (    (this.trackedSessions[sessionId].status !== 'active' && stateActive)
          ||  (this.trackedSessions[sessionId].status === 'active' && !stateActive)
      ) {
        //session state changed
        let session = await this.api.getSession(sessionId);
        if (session.status === 'active') {
          this.trackedSessions[sessionId] = session;
        } else if (session.status === 'closed') {
          delete this.trackedSessions[sessionId]
        }
        debug(`Session [${sessionId}] status changed to: ${session.status}`);
        this.emit('sessionstatechanged', session);
        this.emit('updated', this.trackedSessions);

      }
    }
  }

  public getUrls (session:SupportSession):ScreenMeetUrls {
    if (!this.global.endpoints) {
      throw new Error(`Cannot create ScreenMeet URLs before endpoint config is loaded`);
    }

    const conf = this.global.endpoints.widgetConfig;

    switch (session.type) {
      case "support":
        return {
          "invite" : `${conf.activation_base_url}${session.pin}`,
          "host" : `${conf.viewer_base_url}?${session.id}#token=${encodeURIComponent(this.global.me.session.id)}`,
          "vanity" : `${conf.vanity_url}`
        }
      case "cobrowse":
        return {}
      case "live":
        return {
          "invite" : `${conf.live_url}?${session.id}`,
          "host" : `${conf.live_url}?${session.id}#token=${encodeURIComponent(this.global.me.session.id)}`,
          "vanity" : `${conf.vanity_url}`
        }
      case "replay":
        return {
          "invite" : `${conf.replay_url}${session.id}`
        }
    }
  }


  /**
   * Removes all intervals and event handlers
   */
  destroy() {
    this.emit('destroyed');
    this.global.off('authenticated', this.onAuthenticated);
    this.global.off('signout', this.onSignout);
    this.global.off('discovery', this.onDiscovery);

    this.removeAllListeners();
    this.trackedSessions = {};
    this.global.unregisterFromPolling(this);
    this.destroyed = true;
  }


}

//@ts-ignore
window.ScreenMeet = ScreenMeet;
export default ScreenMeet;

module.exports = {
  ScreenMeet : ScreenMeet,
  ScreenMeetAPI: ScreenMeetAPI
};