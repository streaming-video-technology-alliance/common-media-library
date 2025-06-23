import type { CmcdObjectType } from './CmcdObjectType';

/**
 * CMCD v2 - Request.
 * 
 * Defines the keys for the CMCD (Common Media Client Data) v2 Request group.
 * These keys are used to provide information about the media object being requested.
 * 
 * @group CMCD
 * 
 * @beta
 */
export type CmcdV2Request = {
	/** Object duration (ms) 
	 * 
	 * The playback duration in milliseconds of the object being requested. 
	 * If a partial segment is being requested, then this value MUST indicate the playback duration of that part and not that of its parent segment. 
	 * This value can be an approximation of the estimated duration if the explicit value is not known. 
	 * This value MUST NOT be sent for objects which do not have an object type of ‘a’, ‘v’, ‘av’, ‘tt’, ‘c’, or ‘o’.
	 * 
	 * Integer milliseconds
	*/
	d?: number;

	/** Deadline for when object must be available (ms) 
	 * 
	 * Deadline from the request time until the first sample of this Segment/Object needs to be available in order to not create a 
	 * buffer underrun or any other playback problems. This value MUST be rounded to the nearest 100ms. 
	 * For a playback rate of 1, this may be equivalent to the player’s remaining buffer length.
	 * 
	 * Integer milliseconds
	*/
	dl?: number;

	/** Next object request (relative path or list) 
	 * 
	 * The relative path to one or more objects which can reasonably be expected to be requested by the client making the current request. 
	 * Each object SHOULD be fetched in its entirety unless there is a range associated with the future request. 
	 * If there is a range associated with the future request, then the range is communicated as the parameter 'r' with a String value. 
	 * The formatting of the String value is similar to the HTTP Range header, except that the unit MUST be ‘byte’, the ‘Range:’ prefix is NOT permitted,
	 * specifying multiple ranges is NOT allowed and the only valid combinations are:
	 * "<range-start>-"
	 * "<range-start>-<range-end>"
	 * "-<suffix-length>
	 * 
	 * The client SHOULD NOT depend upon any pre-fetch action being taken - it is merely arequest for such a pre-fetch to take place.
	 * 
	 * An Inner List of Strings
	*/
	nor?: string;

	/** Object type 
	* 
	* The media type of the current object being requested:
	* m = text file, such as a manifest or playlist
	* a = audio only
	* v = video only
	* av = muxed audio and video
	* i = init segment
	* c = caption or subtitle
	* tt = ISOBMFF timed text track
	* k = cryptographic key, license or certificate.
	* o = other
	* 
	* If the object type being requested is unknown, then this key MUST NOT be used.
	* 
	* Token - one of [m,a,v,av,i,c,tt,k,o]
	*/	
	ot?: CmcdObjectType

	/** Requested maximum throughput (kbps) 
	 * 
	 * The requested maximum throughput that the client considers sufficient for delivery of the asset. 
	 * Values MUST be rounded to the nearest 100kbps. 
	 * For example, a client would indicate that the current segment, encoded at 2Mbps, is to be delivered at no more than 10Mbps, by using rtp=10000.
	 * 
	 * Note: This can benefit clients by preventing buffer saturation through over-delivery and can also deliver a community benefit through fair-share delivery. 
	 * The concept is that each client receives the throughput necessary for great performance, but no more. The CDN may not support the rtp feature.
	 * 
	 * Integer kilobits per second (kbps)
	*/
	rtp?: number;

	/** Startup flag (boolean) 
	 * Key is included without a value if the object is needed urgently due to startup, seeking or recovery after a buffer-empty event. 
	 * The player reports this key as true until its buffer first reaches the target buffer for stable playback. 
	 * This key MUST be sent if it is TRUE.
	 * Note: the starting State 's' is valid until the player renders media for the end user, 
	 * which may be different from when the target buffer has been reached. 
	 * As a result, 'su' = TRUE and 'sta' = 's' are not expected to align on a timeline.
	 * 
	 * Boolean
	*/
	su?: boolean;
};
