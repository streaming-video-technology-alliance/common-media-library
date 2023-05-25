/**
 * Resource Timing.
 * 
 * @group Request
 */
export interface ResourceTiming {
  // The timestamp for the time a resource fetch started.
  startTime: number

  // The size (in octets) of the payload body before removing any applied content encodings.
  encodedBodySize: number
  
  // The timestamp immediately after the browser receives the first byte of the response from the server.
  responseStart?: number

  // The timestamp immediately after the browser receives the last byte of the resource or immediately before the transport connection is closed, whichever comes first.
  responseEnd?: number

  // The difference between the responseEnd and the startTime properties.
  duration?: number
}
