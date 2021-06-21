# ScreenMeet JS SDK #

## Installation
You can install ScreenMeet with your favorite JavaScript package manager software or
by cloning the repo from github.

NPM:

```npm install @screenmeet/js-sdk```

Yarn

```yarn add @screenmeet/js-sdk```

Git:

```git clone https://github.com/screenmeet/screenmeet-js-sdk.git```

## API Reference
You can view the full API reference here:

https://screenmeet.github.io/screenmeet-js-sdk/classes/app_screenmeet.screenmeet.html

## Initialization

The current version of the ScreenMeet JS SDK is intended to be used as part of a front-end (browser)
application. Some classes can still be used via a back-end, such as the `ScreenMeetAPI`. However,
back-end authentication methods to acquire a session token are not available in this version.
This support will be added in a future version of the SDK.

### Adding ScreenMeet directly via browser:

1. Copy ```build/bundle.js``` into your project / CDN.
2. Add a script tag to the page to your referencing the bundle file. Optionally, you could also
use the git CDN to include the ScreenMeet SDK bundle file ```https://cdn.jsdelivr.net/gh/screenmeet/screenmeet-js-sdk@master/build/bundle.js``` - we would only recommend doing this in a dev environment.

```html
<!-- when hosting the file yourself -->
<script src="/screenmeet-js-sdk/build/bundle.js"></script>

<!--  directly from CDN: -->
<script src="https://cdn.jsdelivr.net/gh/screenmeet/screenmeet-js-sdk@master/build/bundle.js"></script>
```
 
### Including ScreenMeet in a React Application:
```javascript
import {ScreenMeet} from "@screenmeet/js-sdk";
```

### Including ScreenMeet in a Webpack / JS bundle build:

```javascript
let {ScreenMeet} = require("@screenmeet/js-sdk");
```

## Authentication

### Callback file
Included in the project is a file called `examples/oauth_cb.html` - this file acts as a cross-domain authentication
callback receiver to authenticate users via supported identity providers. This file has to be hosted on the **same domain**
as your front-end applicaiton for authentication to work properly. A URL referencing this file will be required when
invoking authentication.

### Authenticating with a supported provider
The ScreenMeet SDK will manage end-user authenticaiton for you for supported identity providers. In a future release,
additional authenticaiton options will be provided if you would like to use your own identity provider for authentication.
Simply invoke [ScreenMeetMain.signin(provider, cburl, instance)](https://screenmeet.github.io/screenmeet-js-sdk/classes/app_screenmeet.screenmeet.html#signin) to invoke an oauth sign-in to the chosen provider.

**Example**
```javascript

let cburl = document.location.origin + '/oauth_cb.html'; //oauth callback file
let provider = 'sfdc'; //provider
let instance = 'https://login.salesforce.com/' //provider instance (if supported)

try {
  let result = await this.ScreenMeetMain.signin(provider, cburl,instance);
  console.log('Login result', result);
} catch (er) {
  console.log('login failed');
  console.error(er);
}
```

 
## Session Creation and listing

### Configuring the ScreenMeet Object

ScreenMeet sessions can be created in 2 ways: **standalone** or **related to an object**.
Stand-alone mode can be used to create adchoc sessions where the user just wants to create a
ScreenMeet session without it belonging to some other entity such as a Case. When using
related mode, some metadata about the object will be stored along with the ScreenMeet session,
sessions related to that object can then be queries easily by its global unique key.

#### Adhoc mode

```javascript
//this example assumes the user is already authenticated

let sm_global_opts = {
    "mode": "adhoc",
    "persistAuth": true,
    "trackSessionState": true, //will poll for session states for all widgets
    "cbdeployments": true //whether to fetch cobrowse configuration data if using this product
};

let smAdhoc = new ScreenMeet(sm_global_opts);
//creating an adhoc session
let mySession = await smAdhoc.createAdhocSession("cobrowse", "My cobrwose session");
```

#### Object mode

```javascript
//this example assumes the user is already authenticated

let sm_related_opts = {
    "mode": "object", //the mode parameter must be "object"
    "persistAuth": true,
    "trackSessionState": true, //will poll for session states for all widgets
    "cbdeployments": true //whether to fetch cobrowse configuration data if using this product
};

let smForObject = new ScreenMeet(sm_related_opts);

let parentObject =  {
    'id' :   "sfj48wtej9i",
    'app ' : "spiffycrmapp",
    'type' : "case", //object type
    'name' : "Case 12345", //name of object - goes into label field
    'sync' : false //whether eager back-end sync should happen (not yet supported)
};

//create a globally unique key for your object
let objectKey = "spiffycrm.joesdevinstance.case.sfj48wtej9i";

//creating an adhoc session
let myRelatedSession = await smForObject.createRelatedSession( "cobrowse", "Cobrowse for case sfj48wtej9i",  {"record" : true}, parentObject, objectKey);
```


#### Fetching Sessions

There are two methods available for fetching sessions from the API. Fetching sessions for an Adhoc mode instance
will return ALL sessions belonging to the authenticated user. This includes any object-related sessions. Fetching
sessions for a related object will only return the sessions which match the objectKey used to create those sessions.

When sessions the retreived, the `updated` event will also fire on the ScreenMeet object, passing the retreived session
list as the 1st parameter.

```javascript
//Fetching adhoc (all user sessions) via a promise - will return up to 20 sessions - pagination is available
// (see api reference):
let mySessions = await smAdhoc.listUserSessions();

//Fetching related sessions for an object. Takes the object key as a parameter and returns a promise
let myCaseRelatedSessions = await smForObject.listRelatedObjectSessions(objectKey);

//Getting sessions via event handler:

//bind the "updated" event - will fire whenever the session list is updated via a list operation or automatic polling
smForObject.on("updated", (sessions) => { console.log(sessions ) });
smForObject.listRelatedObjectSessions(objectKey); //force the list refresh
```

## Automatic state polling
If the `trackSessionState` option is true when you created your ScreenMeet object, then ScreenMeet
will automatically poll the ScreenMeet back-end for the session state. When a session changes state
from `new` to `active` a `sessionstatechanged` event will be emitted from the ScreenMeet Object.
An `updated` event will also be emitted.

## Examples

Basic HTML example (should be run via web server, not via file://)

https://github.com/screenmeet/screenmeet-js-sdk/tree/master/example

React App Example:

https://github.com/screenmeet/screenmeet-js-sdk-react-demo