/**
 * CEA closed captions packet.
 */
export interface Cta608Packet {
	/**
	 * Presentation timestamp (in second) at which this packet was received.
	 */
	pts: number;

	/**
	 * Type of the packet. Either 0 or 1, representing the CEA-608 field.
	 */
	type: number;

	/**
	 * CTA-608 byte 1.
	 */
	ccData1: number;

	/**
	 * CTA-608 byte 2.
	 */
	ccData2: number;

	/**
	 * A number indicating the order this packet was received in a sequence
	 * of packets. Used to break ties in a stable sorting algorithm
	 */
	order: number;
}
