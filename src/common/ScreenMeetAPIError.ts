export default class ScreenMeetAPIError extends Error {
  response?:XMLHttpRequestResponseType;
  body?: string;
  constructor(message:string) {
    super(message);
  }

}
//