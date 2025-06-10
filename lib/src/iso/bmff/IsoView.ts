import type { ContainerBox } from './boxes/ContainerBox.js';
import type { Fields } from './boxes/Fields.js';
import type { FullBox } from './boxes/FullBox.js';
import type { IsoBmffBox } from './boxes/IsoBmffBox.js';
import { CONTAINERS } from './CONTAINERS.js';
import { DATA } from './fields/DATA.js';
import { INT } from './fields/INT.js';
import { STRING } from './fields/STRING.js';
import { TEMPLATE } from './fields/TEMPLATE.js';
import { UINT } from './fields/UINT.js';
import { UTF8 } from './fields/UTF8.js';
import type { IsoViewConfig } from './IsoViewConfig.js';
import type { IsoFieldTypeMap } from './readers/IsoFieldTypeMap.js';
import { readData } from './readers/readData.js';
import { readInt } from './readers/readInt.js';
import { readString } from './readers/readString.js';
import { readTemplate } from './readers/readTemplate.js';
import { readTerminatedString } from './readers/readTerminatedString.js';
import { readUint } from './readers/readUint.js';
import { readUTF8String } from './readers/readUTF8String.js';
import { readUTF8TerminatedString } from './readers/readUTF8TerminatedString.js';

/**
 * Raw ISO BMFF data box.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type RawBox = {
	type: string;
	size: number;
	largesize?: number;
	usertype?: number[];
	data: IsoView;
};

/**
 * ISO BMFF data view. Similar to DataView, but with additional methods for reading ISO BMFF data.
 * It implements the iterator protocol, so it can be used in a for...of loop.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export class IsoView {
	private dataView: DataView;
	private offset: number;
	private config: IsoViewConfig;
	private truncated: boolean = false;

	/**
	 * Creates a new IsoView instance. Similar to DataView, but with additional
	 * methods for reading ISO BMFF data. It implements the iterator protocol,
	 * so it can be used in a for...of loop.
	 *
	 * @param raw - The raw data to view.
	 * @param config - The configuration for the IsoView.
	 */
	constructor(raw: ArrayBuffer | DataView | Uint8Array, config?: IsoViewConfig) {
		this.dataView = (raw instanceof ArrayBuffer) ? new DataView(raw) : (raw instanceof Uint8Array) ? new DataView(raw.buffer, raw.byteOffset, raw.byteLength) : raw;
		this.offset = this.dataView.byteOffset;
		this.config = config || { recursive: false, parsers: {} };
	}

	/**
	 * The current byteoffset in the data view.
	 */
	get cursor(): number {
		return this.offset - this.dataView.byteOffset;
	}

	/**
	 * Whether the end of the data view has been reached.
	 */
	get done(): boolean {
		return this.cursor >= this.dataView.byteLength || this.truncated;
	}

	/**
	 * The number of bytes remaining in the data view.
	 */
	get bytesRemaining(): number {
		return this.dataView.byteLength - this.cursor;
	}

	/**
	 * Creates a new IsoView instance with a slice of the current data view.
	 *
	 * @param size - The size of the slice.
	 * @returns A new IsoView instance.
	 */
	slice = (size: number): IsoView => {
		const dataView = new DataView(this.dataView.buffer, this.offset, size);
		this.offset += size;
		return new IsoView(dataView, this.config);
	};

	private read = <T extends keyof IsoFieldTypeMap>(type: T, size: number = 0): IsoFieldTypeMap[T] => {
		// TODO: Change all sizes from bits to bytes
		const { dataView, offset } = this;

		let result: any;
		let cursor = size;

		switch (type) {
			case UINT:
				result = readUint(dataView, offset, size);
				break;

			case INT:
				result = readInt(dataView, offset, size);
				break;

			case TEMPLATE:
				result = readTemplate(dataView, offset, size);
				break;

			case STRING:
				if (size === -1) {
					result = readTerminatedString(dataView, offset);
					cursor = result.length + 1;
				}
				else {
					result = readString(dataView, offset, size);
				}
				break;

			case DATA:
				result = readData(dataView, offset, size);
				cursor = result.length;
				break;

			case UTF8:
				if (size === -1) {
					result = readUTF8TerminatedString(dataView, offset);
					cursor = result.length + 1;
				}
				else {
					result = readUTF8String(dataView, offset);
				}
				break;

			default:
				result = -1;
		}

		this.offset += cursor;

		return result;
	};

	/**
	 * Reads a unsigned integer from the data view.
	 *
	 * @param size - The size of the integer in bytes.
	 * @returns The unsigned integer.
	 */
	readUint = (size: number): number => {
		return this.read(UINT, size);
	};

	/**
	 * Reads a signed integer from the data view.
	 *
	 * @param size - The size of the integer in bytes.
	 * @returns The signed integer.
	 */
	readInt = (size: number): number => {
		return this.read(INT, size);
	};

	/**
	 * Reads a string from the data view.
	 *
	 * @param size - The size of the string in bytes.
	 * @returns The string.
	 */
	readString = (size: number): string => {
		return this.read(STRING, size);
	};

	/**
	 * Reads a template from the data view.
	 *
	 * @param size - The size of the template in bytes.
	 * @returns The template.
	 */
	readTemplate = (size: number): number => {
		return this.read(TEMPLATE, size);
	};

	/**
	 * Reads a byte array from the data view.
	 *
	 * @param size - The size of the data in bytes.
	 * @returns The data.
	 */
	readData = (size: number): Uint8Array => {
		return this.read(DATA, size);
	};

	/**
	 * Reads a UTF-8 string from the data view.
	 *
	 * @param size - The size of the string in bytes.
	 * @returns The UTF-8 string.
	 */
	readUtf8 = (size?: number): string => {
		return this.read(UTF8, size);
	};

	/**
	 * Reads a full box from the data view.
	 *
	 * @returns The full box.
	 */
	readFullBox = (): Fields<FullBox> => {
		return {
			version: this.readUint(1),
			flags: this.readUint(3),
		};
	};

	/**
	 * Reads an array of values from the data view.
	 *
	 * @param type - The type of the values.
	 * @param size - The size of the values in bytes.
	 * @param length - The number of values to read.
	 * @returns The array of values.
	 */
	readArray = <T extends keyof IsoFieldTypeMap>(type: T, size: number, length: number): IsoFieldTypeMap[T][] => {
		const value = [];

		for (let i = 0; i < length; i++) {
			value.push(this.read(type, size));
		}

		return value as IsoFieldTypeMap[T][];
	};

	/**
	 * Reads a raw box from the data view.
	 *
	 * @returns The box.
	 */
	readBox = (): RawBox => {
		const { dataView, offset } = this;

		// read box size and type without advancing the cursor in case the box is truncated
		let cursor = 0;

		const box = {
			size: readUint(dataView, offset, 4),
			type: readString(dataView, offset + 4, 4),
		} as RawBox;

		cursor += 8;

		if (box.size === 1) {
			box.largesize = readUint(dataView, offset + cursor, 8);
			cursor += 8;
		}

		const actualSize = box.largesize || box.size;
		if (this.cursor + actualSize > dataView.byteLength) {
			this.truncated = true;
			throw new Error('Truncated box');
		}

		this.offset += cursor;
		if (box.type === 'uuid') {
			box.usertype = this.readArray('uint', 1, 16);
		}

		const viewSize = box.size === 0 ? this.bytesRemaining : actualSize - cursor;
		box.data = this.slice(viewSize);

		return box;
	};

	/**
	 * Reads a number of boxes from the data view.
	 *
	 * @param length - The number of boxes to read.
	 * @returns The boxes.
	 */
	readBoxes = <T = IsoBmffBox>(length: number): T[] => {
		const result: T[] = [];

		for (const box of this) {
			result.push(box as T);

			if (length > 0 && result.length >= length) {
				break;
			}
		}

		return result;
	};

	/**
	 * Reads a number of entries from the data view.
	 *
	 * @param length - The number of entries to read.
	 * @param map - The function to map the entries.
	 * @returns The entries.
	 */
	readEntries = <T>(length: number, map: () => T): T[] => {
		const result: T[] = [];

		for (let i = 0; i < length; i++) {
			result.push(map());
		}

		return result;
	};

	/**
	 * Iterates over the boxes in the data view.
	 *
	 * @returns A generator of boxes.
	 */
	*[Symbol.iterator](): Generator<IsoBmffBox> {
		const { parsers = {}, recursive = false } = this.config;

		while (!this.done) {
			try {
				const { type, data, ...rest } = this.readBox();
				const box = { type, ...rest } as IsoBmffBox;
				const parser = parsers[type] || parsers[type.trim()]; // url and urn boxes have a trailing space in their type field

				if (parser) {
					Object.assign(box, parser(data, this.config));
				}

				box.view = data;

				if (CONTAINERS.includes(type)) {
					const boxes = [];

					for (const child of data) {
						if (recursive) {
							yield child;
						}

						boxes.push(child);
					}

					(box as ContainerBox<IsoBmffBox>).boxes = boxes;
				}

				yield box;
			}
			catch (error) {
				break;
			}
		}
	}
}
