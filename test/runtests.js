//basic api testing back-end script
console.log('Beginning screenmeet api test process, key: ' + process.argv[2]);

const ScreenMeetAPI = require('../lib/ScreenMeetAPI');

async function runTests() {
  let API = new ScreenMeetAPI();
  //key
  if (process.argv[2]) {
    API.setKey(process.argv[2])
    console.log(`Set API key from CLI ${process.argv[2].substr(0, 6)}*********`);
  }
  try {
    let result = await API.me();
    console.log(result);
  } catch (er) {
    console.log('Error calling screenmeet API');
    console.error(er);
  }
  
}

runTests();