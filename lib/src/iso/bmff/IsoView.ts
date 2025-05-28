import type { Box } from './Box.js';
import { ContainerBoxes } from './ContainerBoxes.js';
import { DATA } from './fields/DATA.js';
import { INT } from './fields/INT.js';
import { STRING } from './fields/STRING.js';
import { TEMPLATE } from './fields/TEMPLATE.js';
import { UINT } from './fields/UINT.js';
import { UTF8 } from './fields/UTF8.js';
import type { FullBox } from './FullBox.js';
import type { IsoViewConfig } from './IsoViewConfig.js';
import type { ISOFieldTypeMap } from './readers/ISOFieldTypeMap.js';
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

	constructor(raw: ArrayBuffer | DataView | Uint8Array, config?: IsoViewConfig) {
		this.dataView = (raw instanceof ArrayBuffer) ? new DataView(raw) : (raw instanceof Uint8Array) ? new DataView(raw.buffer, raw.byteOffset, raw.byteLength) : raw;
		this.offset = this.dataView.byteOffset;
		this.config = config || { recursive: false, parsers: {} };
	}

	get cursor(): number {
		return this.offset - this.dataView.byteOffset;
	}

	get done(): boolean {
		return this.cursor >= this.dataView.byteLength || this.truncated;
	}

	get bytesRemaining(): number {
		return this.dataView.byteLength - this.cursor;
	}

	slice = (size: number): IsoView => {
		const dataView = new DataView(this.dataView.buffer, this.offset, size);
		this.offset += size;
		return new IsoView(dataView, this.config);
	};

	private read = <T extends keyof ISOFieldTypeMap>(type: T, size: number = 0): ISOFieldTypeMap[T] => {
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

	readUint = (size: number): number => {
		return this.read(UINT, size);
	};

	readInt = (size: number): number => {
		return this.read(INT, size);
	};

	readString = (size: number): string => {
		return this.read(STRING, size);
	};

	readTemplate = (size: number): number => {
		return this.read(TEMPLATE, size);
	};

	readData = (size: number): Uint8Array => {
		return this.read(DATA, size);
	};

	readUtf8 = (size?: number): string => {
		return this.read(UTF8, size);
	};

	readFullBox = (): FullBox => {
		return {
			version: this.readUint(1),
			flags: this.readUint(3),
		};
	};

	readArray = <T extends keyof ISOFieldTypeMap>(type: T, size: number, length: number): ISOFieldTypeMap[T][] => {
		const value = [];

		for (let i = 0; i < length; i++) {
			value.push(this.read(type, size));
		}

		return value as ISOFieldTypeMap[T][];
	};

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

	readBoxes = (length: number): Box[] => {
		const result: Box[] = [];

		for (const box of this) {
			result.push(box);

			if (length > 0 && result.length >= length) {
				break;
			}
		}

		return result;
	};

	readEntries = <T>(length: number, map: () => T): T[] => {
		const result: T[] = [];

		for (let i = 0; i < length; i++) {
			result.push(map());
		}

		return result;
	};

	*[Symbol.iterator](): Generator<Box> {
		const { parsers = {}, recursive = false } = this.config;

		while (!this.done) {
			try {
				const { type, data, ...rest } = this.readBox();
				const box = { type, ...rest } as Box;
				const parser = parsers[type] || parsers[type.trim()]; // url and urn boxes have a trailing space in their type field
				if (parser) {
					Object.assign(box, parser(data, this.config));
				}

				if (ContainerBoxes.includes(type)) {
					const boxes = [];

					for (const child of data) {
						if (recursive) {
							yield child;
						}

						boxes.push(child);
					}

					box.boxes = boxes;
				}

				yield box;
			}
			catch (error) {
				break;
			}
		}
	}
}
