import type { IsoBoxContainer } from './IsoBoxContainer.ts'
import type { IsoBoxReader } from './IsoBoxReader.ts'
import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'
import type { IsoParsedBox } from './IsoParsedBox.ts'
import type { ParsedBox } from './ParsedBox.ts'

/**
 * Return type for a box reader.
 *
 * @public
 */
export type BoxReturn<T extends IsoBoxReaderMap> = IsoParsedBox<{
	[K in keyof T]: T[K] extends IsoBoxReader<infer B> ? B : never;
}[keyof T]>;

/**
 * Return type for a container reader
 *
 * @public
 */
export type ContainerReturn = IsoParsedBox<IsoBoxContainer>;

/**
 * Return type for the ISO box reader
 *
 * @public
 */
export type IsoBoxReaderReturn<T extends IsoBoxReaderMap> = BoxReturn<T> | ContainerReturn | ParsedBox;
