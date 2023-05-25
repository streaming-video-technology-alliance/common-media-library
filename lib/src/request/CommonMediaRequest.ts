import { Cmcd } from '../cmcd';

/**
 * Common request API.
 * 
 * @group Request
 */
export interface CommonMediaRequest {

  /**
   * The URL of the request.
   */
  url: string

  /**
   * The request's method (GET, POST, etc).
   */
  method: string

  /**
   * The response type with which the response from the server shall be compatible.
   */
  responseType?: string

  /**
   * The headers object associated with the request.
   */
  headers?: Record<string, string>

  /**
   * Indicates whether the user agent should send or receive cookies from the other domain in the case of cross-origin requests.
   */
  credentials?: RequestCredentials

  /**
   * The mode of the request (e.g., cors, no-cors, same-origin, etc).
   */
  mode?: RequestMode

  /**
   * The number of milliseconds the request can take before automatically being terminated.
   * If undefined or value is 0 then there is no timeout.
   */
  timeout?: number

  /**
   * The Common Media Client Data (CMCD) that comprises media and request related information.
   */
  cmcd?: Cmcd

  /**
   * Any custom data.
   */
  customData?: any

  /**
   * The progress event listener to be notified when the request receives more data.
   * Note: a RequestPlugin that executes the request shall call back this listener (see RequestPlugin API)
   */
  onprogress?: (e: ProgressEvent) => void

  /**
   * The load event listener to be notified when the request transaction completes successfully.
   * Note: a RequestPlugin that executes the request shall call back this listener (see RequestPlugin API)
   */
  onload?: (e?: ProgressEvent) => void

  /**
   * The loadend event listener to be notified when the request has completed (after load) successfully or unsuccessfully.
   * Note: a RequestPlugin that executes the request shall call back this listener (see RequestPlugin API)
   */
  onloadend?: (e?: ProgressEvent) => void

  /**
   * The abort event listener to be notified when the request has been aborted.
   * Note: a RequestPlugin that executes the request shall call back this listener (see RequestPlugin API)
   */
  onabort?: (e?: ProgressEvent) => void

  /**
   * The timeout event listener to be notified when progression is terminated due to preset time expiring.
   * Note: a RequestPlugin that executes the request shall call back this listener (see RequestPlugin API)
   */
  ontimeout?: (e?: ProgressEvent) => void

  /**
   * The error event listener to be notified when the request encountered an error.
   * Note: a RequestPlugin that executes the request shall call back this listener (see RequestPlugin API)
   */
  onerror?: (e: ErrorEvent) => void

  /**
   * The abort callback function to be called for aborting.
   * Note: a RequestPlugin that executes the request shall provide this callback function (see RequestPlugin API)
   */
  abort?: () => void
}
