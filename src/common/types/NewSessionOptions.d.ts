import {ScreenMeetSessionType} from "./Products";

export type LiveSessionAgentPrefs = {
  'knock' : boolean,
  'record' : boolean,
  'audio' : boolean
};

export type CobrowseSessionAgentPrefs = {
  'record' : boolean
};

export type SupportSessionAgentPrefs = {
  'record' : boolean,
  'prerequestrc' : boolean,
  'prerequestadmin' : boolean
}

export type ReplaySessionAgentPrefs = {}

export type AgentPrefOptions = SupportSessionAgentPrefs | LiveSessionAgentPrefs | CobrowseSessionAgentPrefs | ReplaySessionAgentPrefs;

export type ParentObject = {
  'string' : string
  'app ' : string,
  'type' : string, //object type
  'name' : string, //name of object - goes into label field
  'sync' : boolean,
  'provider' : string
};

export type NewSessionOptions = {
  userDescription: string,
  label: string,
  type: ScreenMeetSessionType,
  agentPrefs: AgentPrefOptions /** Options for this session type **/
  externalMapping?: string, /** This should be a globally unique key referencing this object - eg, an external key with which the session will be associated. parentObject is requierd if this is set */
  parentObject?: ParentObject, /** a description of the parent object. externalMapping is required if setting this option */
  metaData?: {[key:string]:any},
}