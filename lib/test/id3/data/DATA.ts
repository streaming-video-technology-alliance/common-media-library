import { strToCodes } from '../../utils/strToCodes.js';

export const DATA = 'data';
export const DATA_BYTES = strToCodes(DATA);
export const DATA_UINT8 = new Uint8Array(DATA_BYTES);
