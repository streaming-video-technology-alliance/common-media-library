import type { IsoBoxContainer } from './IsoBoxContainer.ts'
import type { IsoBoxReader } from './IsoBoxReader.ts'
import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'
import type { IsoParsedBox } from './IsoParsedBox.ts'
import type { ParsedBox } from './ParsedBox.ts'

/**
 * Extracts the return type from a reader function
 *
 * @public
 */
export type ReaderReturnType<T> = T extends IsoBoxReader<infer B>
	? B
	: T extends (...args: never[]) => infer R
	? R extends { type: string } ? R : never
	: never;

/**
 * Return type for a box reader.
 *
 * @public
 */
export type BoxReturn<T extends IsoBoxReaderMap> = IsoParsedBox<{
	[K in keyof T]: ReaderReturnType<T[K]>;
}[keyof T]>;

/**
 * Return type for a container reader
 *
 * @public
 */
export type ContainerReturn = IsoParsedBox<IsoBoxContainer>;

/**
 * Return type for the ISO box reader.
 *
 * When T is the full IsoBoxReaderMap (not narrowed), returns ParsedBox.
 * When T is a specific narrow reader map, includes BoxReturn<T> for better type inference.
 *
 * @public
 */
export type IsoBoxReaderReturn<T extends IsoBoxReaderMap> =
	IsoBoxReaderMap extends T
	? ParsedBox
	: BoxReturn<T> | ContainerReturn | ParsedBox;
