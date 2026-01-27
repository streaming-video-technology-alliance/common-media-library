import type { XmlNode } from '@svta/cml-xml'

/**
 * The a request's `responseType` to the corresponding data type.
 *
 * @public
 */
export type ResponseTypeMap<T extends string | undefined> =
	T extends 'json' ? any :
	T extends 'text' ? string :
	T extends 'blob' ? Blob :
	T extends 'arraybuffer' ? ArrayBuffer :
	T extends 'document' ? XmlNode :
	T extends 'stream' ? ReadableStream :
	unknown;
