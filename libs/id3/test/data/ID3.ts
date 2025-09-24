import { strToCodes } from '../utils/strToCodes.ts';

export const ID3_BYTES: number[] = strToCodes('ID3');
export const ID3_VERSION_BYTES: number[] = [0x04, 0x00];
