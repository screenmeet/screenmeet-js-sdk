import {ScreenMeetAPI} from '../common/ScreenMeetAPI';

export default class ScreenMeet {
  api: ScreenMeetAPI;
  constructor() {
    this.api = new ScreenMeetAPI();
  }

  login = () => {
    console.log('test for build');
  }

}

//@ts-ignore
window.ScreenMeet = ScreenMeet;

module.exports = ScreenMeet;