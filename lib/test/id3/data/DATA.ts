import { strToCodes } from '../../utils/strToCodes.js';

export const DATA: string = 'data';
export const DATA_BYTES: number[] = strToCodes(DATA);
export const DATA_UINT8: Uint8Array = new Uint8Array(DATA_BYTES);
