export default class ScreenMeetAPIError extends Error {
  response?:XMLHttpRequestResponseType;
  body?: string;
  options?: { [key:string]:any };
  constructor(message:string) {
    super(message);
  }

}
//