/**
 * Resource Timing.
 * 
 * @group Request
 */
export interface ResourceTiming {
  // Returns the timestamp for the time a resource fetch started.
  startTime?: number

  // Returns a timestamp that is the difference between the responseEnd and the startTime properties.
  duration?: number

  // A number representing the size (in octets) of the fetched resource. The size includes the response header fields plus the response payload body.
  transferSize?: number
  
  // A timestamp immediately after the browser receives the first byte of the response from the server.
  responseStart?: number

  // A timestamp immediately after the browser receives the last byte of the resource or immediately before the transport connection is closed, whichever comes first.
  responseEnd?: number
}
