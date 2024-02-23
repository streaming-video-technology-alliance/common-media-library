import { Track } from '../model';

type IHam = {
	getTracks: (predicate?: (track: Track) => boolean) => Track[];
	toString: () => string;
};

export type { IHam };
