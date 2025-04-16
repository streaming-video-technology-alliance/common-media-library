import { readUint } from './readUint.ts';

export function readTemplate(dataView: DataView, offset: number, size: number): number {
	const half = size / 2;
	const pre = readUint(dataView, offset, half);
	const post = readUint(dataView, offset + half, half);
	return pre + (post / Math.pow(2, half));
};
