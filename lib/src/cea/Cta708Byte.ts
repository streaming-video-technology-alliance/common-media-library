/**
 * CTA-708 closed captions byte.
 */
export interface Cta708Byte {
	/**
	 * Presentation timestamp (in second) at which this packet was received.
	 */
	pts: number;

	/**
	 * Type of the byte. Either 2 or 3, DTVCC Packet Data or a DTVCC Packet Start.
	 */
	type: number;

	/**
	 * The byte containing data relevant to the packet.
	 */
	value: number;

	/**
	 * A number indicating the order this packet was received in a sequence
	 * of packets. Used to break ties in a stable sorting algorithm
	 */
	order: number;
}
