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
  agentPrefs: AgentPrefOptions
  externalMapping?: string, //new multi-session API
  parentObject?: ParentObject, //commented while data sync not avail
  metaData?: {[key:string]:any},
}