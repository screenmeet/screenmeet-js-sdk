import fetch from 'node-fetch';
import ScreenMeetAPIError from "./ScreenMeetAPIError";
import {MeResponse} from "./types/MeResponse";
import {NewSessionOptions} from "./types/NewSessionOptions";
import {SupportSession} from "./types/ScreenMeetSession";

const querystring = require('querystring');

export default class ScreenMeetAPI {
  key: string = '';
  endpoint: string = 'https://api-v3.screenmeet.com/v3';

  setKey = (key: string) => {
    this.key = key;
  }

  me = async ():Promise<MeResponse> =>  {
    return this.get('/me');
  }

  signout = async ():Promise<any> =>  {
    let result = this.get('/auth/signout');
    this.key = '';
    return result;
  }

  createSession = async (params:NewSessionOptions):Promise<SupportSession> => {
    return await this.post('/supportsessions', params);
  }

  /**
   * Begin base methods
   */

  getBaseUrl = ():string => {
    return this.endpoint
  }

  getDefaultHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Session-id': this.key,
      'client-app': 'screenmeet-js-sdk'
    }
  }

  delete = async (path: string, params?: { [key: string]: any }) => {

    var options = {
      body: JSON.stringify(params),
      method: 'DELETE',
      url: this.getBaseUrl() + path,
      headers: this.getDefaultHeaders()
    }

    let fetchResult = await fetch(options.url, options);
    return await this.parseResponse(fetchResult, options);

  }

  put = async (path: string, params?: { [key: string]: any }) => {

    var options = {
      body: JSON.stringify(params),
      method: 'PUT',
      url: this.getBaseUrl() + path,
      headers: this.getDefaultHeaders()
    }

    let fetchResult = await fetch(options.url, options);
    return await this.parseResponse(fetchResult, options);

  }


  post = async (path: string, params?: { [key: string]: any }) => {

     var options = {
       body: JSON.stringify(params),
       method: 'POST',
       url: this.getBaseUrl() + path,
       headers: this.getDefaultHeaders()
     }

    let fetchResult = await fetch(options.url, options);
    return await this.parseResponse(fetchResult, options);

   }

  get = async (path: string, params?: { [key: string]: any }) => {

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

/*


import connect from "react-redux/es/connect/connect";

/**
 * REST Interface for back-end API


var querystring = require('querystring');

class ScreenMeetAPI {

  store = null;

  base_url = null;

  session_id = '0';

  setStore(store) {
    this.store = store;
  }

  getBaseUrl() {
    if (!this.base_url) {
      this.base_url = this.store.getState().config.urls.api
    }
    return this.base_url;
  }

  session = {
    me: () => {
      return this.get(`/me`);
    },
    signout: () => {
      return this.get(`/auth/signout`);
    },
    getWidgetConfig: () => {
      const orgId = this.store.getState().org.id;
      return this.get(`/organization/${orgId}/remotewidgetconfig`).then((result => {
        if (result.widgetConfig && result.widgetConfig.cobrowse) {
          return this.org.getCobrowseDeployments(orgId).then(cobrowseDeployments => {
            result.widgetConfig.cobrowseDeployments = cobrowseDeployments;
            return result;
          });
        } else {
          return result;
        }
      }));
    }
  };

  support = {
    createSupportSessions: (data) => {
      return this.post('/supportsessions', data);
    },
    closeSession: (code) => {
      return this.delete(`/supportsession/${code}`, {});
    },
    getSessionList: (key) => {
      return this.get(`/crmlookup/${key}`);
    }
  };

  org = {
    getCobrowseDeployments: (orgId) => {
      return this.get(`/organization/${orgId}/cobrowsedeployments`);
    }
  };

  /**
   * Returns current session id
   * @private

  _getSessionId() {
    if (this.store && this.store.getState().session) {
      return this.store.getState().session.id
    }
  }

  _getDefaultHeaders() {
    return {
      'Content-Type': 'application/json',
      'Session-id': this._getSessionId(),
      'client-app' : 'crm-widget'
    }
  }


  /**
   * Returns configuration data for a certain path.
   *
   * @param dotpath
   * @returns {Promise.<TResult>}

  getConfiguration(dotpath) {
    return this.get(`/configuration/${dotpath}`);
  }



  /**
   * Authenticates a user with a code received by a callback URL from an oauth provider
   * @param provider
   * @param code

  authWithOauthCode(provider, code, instance_url, state) {
    var params =  {code: code};
    if (instance_url) {
      params.instance_url = instance_url;
    }
    if (state) {
      params.state = state;
    }
    return this.get(`/auth/${provider}/exchangeCode`, params)
  }


  /**
   * Authenticates a user with the given provider by using a token (eg, a session ID).
   * @param session_token string
   *
   *
   * @param instance_url

  authWithToken(provider, session_token) {

    var payload = {session_token: session_token};

    //console.log('attempting to post json to auth', payload);

    return this.post(`/auth/${provider}/authWithToken`, payload);
  }

  /***
   *
   */

/**
 * Post request maker
 * @param path
 * @param params
 * @returns {Promise.<TResult>}

 post(path, params) {

    var options = {
      body: JSON.stringify(params),
      method: 'POST',
      url: this.getBaseUrl() + path,
      headers: this._getDefaultHeaders()
    }

    return fetch(options.url, options )
      .then(this.getResponseHandler(options))
      .catch((er) => {
        er.request = options;
        throw er;
      })

  }


 /**
 * DELETE request maker
 * @param path
 * @param params
 * @returns {Promise.<TResult>}

 delete(path, params) {

    var options = {
      body: JSON.stringify(params),
      method: 'DELETE',
      url: this.getBaseUrl() + path,
      headers: this._getDefaultHeaders()
    }

    return fetch(options.url, options )
      .then(this.getResponseHandler(options))
      .catch((er) => {
        er.request = options;
        throw er;
      })

  }

 /**
 * Put request maker
 * @param path
 * @param params
 * @returns {Promise.<TResult>}

 put(path, params) {

    var options = {
      body: JSON.stringify(params),
      method: 'PUT',
      url: this.getBaseUrl() + path,
      headers: this._getDefaultHeaders()
    }

    return fetch(options.url, options )
      .then(this.getResponseHandler(options))
      .catch((er) => {
        er.request = options;
        throw er;
      })

  }


 /**
 * GET request maker
 * @param path
 * @param params
 * @returns {Promise.<TResult>}

 get(path, params) {

    var options = {
      method: 'GET',
      url: this.getBaseUrl() + path + '?' + querystring.stringify(params),
      headers: this._getDefaultHeaders()
    }

    return fetch(options.url, options )
      .then(this.getResponseHandler(options))
      .catch((er) => {
        er.request = options;
        throw er;
      })

  }



 /**
 * Returns a handler for the response. Wrapped for debugging/error stuff.
 * @param options
 * @returns {function(*)}

 getResponseHandler(options) {

    var request_time = new Date();

    return (response) => {

      if (response.status === 200) {
        return response.json()
          .then((result) => {

            return result;

          });
      } else {
        var response_time = new Date();

        if (response.status === 401) {
          var Err = new Error(`Your session has expired or you have signed out in another window`);
        } else {
          var Err = new Error(`HTTP ${response.status} ${response.statusText} while making API request`);
        }

        Err.response = response;
        Err.times = {
          'request' : request_time,
          'response' : response_time,
          'duration_ms' : response_time - request_time
        };

        return response.text().then((bodyData) => {
          Err.bodyText = bodyData;
          throw Err;
        })

      }
    }
  }

 /**
 * This is decoupled so that each respective promise chain can wrap itself up properly and in order.
 * They will use this as .catch(API.handleApiError)
 * @param err

 handleApiError = (err) => {

    if (err && err.response && err.response.status === 401) {
      this.store.dispatch({'type' : 'LOG_OUT', 'message' : 'You session has expired'});
    } else {
      this.store.dispatch({'type' : 'UNEXPECTED_ERROR', 'error' : err});
    }


  }

 async sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder("utf-8").encode(str));
    return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
  }

 }

 export default new ScreenMeetAPI();
 */

module.exports = ScreenMeetAPI;