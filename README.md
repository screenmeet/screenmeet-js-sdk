# ScreenMeet JS SDK #

## Installation
---
You can install ScreenMeet with your favorite JavaScript package manager software or
by cloning the repo from github.

NPM:

```npm install @screenmeet/js-sdk```

Yarn

```yarn add @screenmeet/js-sdk```

Git:

```git clone https://github.com/screenmeet/screenmeet-js-sdk.git```

## Initialization

The current version of the ScreenMeet JS SDK is intended to be used as part of a front-end (browser)
application. Some classes can still be used via a back-end, such as the `ScreenMeetAPI`. However,
back-end authentication methods to acquire a session token are not available in this version.
This support will be added in a future version of the SDK.

### Adding ScreenMeet directly via browser:

1. Copy ```build/bundle.js``` into your project / CDN.
2. Add a script tag to the page to your referencing the bundle file. Optionally, you could also
use the git CDN to include the ScreenMeet SDK bundle file ```https://cdn.jsdelivr.net/gh/screenmeet/screenmeet-js-sdk@master/build/bundle.js``` - we would only recommend doing this in a dev environment.

        //when hosting the file yourself
        <script src="/screenmeet-js-sdk/build/bundle.js></script>
        
        //directly from CDN:
        <script src="https://cdn.jsdelivr.net/gh/screenmeet/screenmeet-js-sdk@master/build/bundle.js"></script> 

### Including ScreenMeet in a React Application:

        import {ScreenMeet} from "@screenmeet/js-sdk";
        
### Including ScreenMeet in a Webpack / JS bundle build:

        let {ScreenMeet} = require("@screenmeet/js-sdk");
