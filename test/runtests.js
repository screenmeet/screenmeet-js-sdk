//basic api testing back-end script
//@todo make actual mocha package thing
console.log('Beginning screenmeet api test process, key: ' + process.argv[2]);

const {ScreenMeetAPI} = require('../lib/ScreenMeetAPI');

async function runTests() {
  let API = new ScreenMeetAPI();
  
  if (process.argv[2]) {
    API.setKey(process.argv[2])
    console.log(`Set API key from CLI ${process.argv[2].substr(0, 6)}*********`);
  }
  let me;
  
  try {
    me = await API.me();
  } catch (er) {
    console.log('Error calling screenmeet API');
    console.error(er);
    return;
  }
  //
  // let newSession = await API.createSession({
  //   userDescription: me.session.name,
  //   label: 'test session',
  //   type: "support",
  //   agentPrefs: {
  //     'record' : true,
  //     'prerequestrc' : false,
  //     'prerequestadmin' : false
  //   },
  // });
  //
  // console.log(newSession);
  //
  //
  // console.log('Session created, fetching list:');
  // let mySessionList = await  API.listUserSessions();
  //
  // let closeId = mySessionList.rows[0].id
  //
  // console.log(mySessionList);
  // console.log('Closing 1st session in list: ' + closeId);
  //
  // let deleteResult = await API.closeSession(closeId);
  // console.log(deleteResult);
  //
  //
  // console.log('Getting cobrowse data for org ' + me.org.id)
  //
  // let cbDeployments = await API.getCobrowseDeployments(me.org.id);
  //
  // console.log(JSON.stringify(cbDeployments, null, 3));
  //
  //
  console.log('Getting widget config data for org ' + me.org.id)

  let endpoints = await API.getEndpointsConfig(me.org.id);

  console.log(JSON.stringify(endpoints, null, 3));
}

runTests();