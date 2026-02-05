import type { XmlNode } from './XmlNode.ts'

/**
 * Maps a request's `responseType` to the corresponding data type.
 *
 * @public
 */
export type ResponseTypeMap<T extends string | undefined> =
	T extends 'json' ? any :
	T extends 'text' ? string :
	T extends 'blob' ? Blob :
	T extends 'arrayBuffer' ? ArrayBuffer :
	T extends 'document' ? XmlNode :
	T extends 'stream' ? ReadableStream :
	unknown;
