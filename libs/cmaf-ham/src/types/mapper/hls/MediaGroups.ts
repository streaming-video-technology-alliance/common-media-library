/**
 * HLS Media Groups
 *
 * @alpha
 */
export type MediaGroups = {
	AUDIO: {
		[key: string]: {
			[key: string]: {
				language: string;
			};
		};
	};
	SUBTITLES: {
		[key: string]: {
			[key: string]: {
				language: string;
			};
		};
	};
};
