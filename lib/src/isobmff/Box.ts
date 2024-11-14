/**
 * Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type Box<V = any> = {
	type: string;
	size: number;
	value: V;
}
