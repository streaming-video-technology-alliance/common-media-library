import { DATA } from './fields/DATA.js';
import { INT } from './fields/INT.js';
import { STRING } from './fields/STRING.js';
import { TEMPLATE } from './fields/TEMPLATE.js';
import { UINT } from './fields/UINT.js';
import { UTF8 } from './fields/UTF8.js';
import type { FullBox } from './FullBox.js';
import type { ISOFieldTypeMap } from './readers/ISOFieldTypeMap.js';
import { readData } from './readers/readData.js';
import { readInt } from './readers/readInt.js';
import { readString } from './readers/readString.js';
import { readTemplate } from './readers/readTemplate.js';
import { readTerminatedString } from './readers/readTerminatedString.js';
import { readUint } from './readers/readUint.js';
import { readUTF8String } from './readers/readUTF8String.js';
import { readUTF8TerminatedString } from './readers/readUTF8TerminatedString.js';

export class CursorView {
	private dataView: DataView;
	private offset: number;

	constructor(raw: ArrayBuffer | DataView) {
		this.dataView = (raw instanceof ArrayBuffer) ? new DataView(raw) : raw;
		this.offset = this.dataView.byteOffset;
	}

	get cursor(): number {
		return this.offset - this.dataView.byteOffset;
	}

	get done(): boolean {
		return this.cursor >= this.dataView.byteLength;
	}

	get bytesRemaining(): number {
		return this.dataView.byteLength - this.cursor;
	}

	slice = (size: number): CursorView => {
		const dataView = new DataView(this.dataView.buffer, this.offset, size);
		this.offset += size;
		return new CursorView(dataView);
	};

	private read = <T extends keyof ISOFieldTypeMap>(type: T, size: number = 0): ISOFieldTypeMap[T] => {
		// TODO: Change all sizes from bits to bytes
		const { dataView, offset } = this;

		let result: any;
		let cursor = 0;

		switch (type) {
			case UINT:
				result = readUint(dataView, offset, size);
				cursor = size;
				break;

			case INT:
				result = readInt(dataView, offset, size);
				cursor = size;
				break;

			case TEMPLATE:
				result = readTemplate(dataView, offset, size);
				cursor = size;
				break;

			case STRING:
				if (size === -1) {
					result = readTerminatedString(dataView, offset);
					size = result.length;
				}
				else {
					result = readString(dataView, offset, size);
				}
				cursor = size;
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
				cursor = size;
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

	readUtf8 = (size: number): string => {
		return this.read(UTF8, size);
	};

	readFullBox = (): FullBox => {
		return {
			version: this.read(UINT, 1),
			flags: this.read(UINT, 3),
		};
	};

	readArray = <T extends keyof ISOFieldTypeMap>(type: T, size: number, length: number): ISOFieldTypeMap[T][] => {
		const value = [];

		for (let i = 0; i < length; i++) {
			value.push(this.read(type, size));
		}

		return value as ISOFieldTypeMap[T][];
	};
}
