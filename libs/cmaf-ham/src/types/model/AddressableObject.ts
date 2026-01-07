/**
 * CMAF-HAM Addressable Object type
 *
 * @alpha
 */
export type AddressableObject = {
	url: string;
	byteRange?: {
		start: number;
		end: number;
	}
}
