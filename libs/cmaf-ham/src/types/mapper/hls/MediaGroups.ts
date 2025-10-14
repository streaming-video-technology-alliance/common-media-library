/**
 * HLS Media Groups
 *
 * @alpha
 */
export type MediaGroups = {
	AUDIO: Record<string, Record<string, {
				language: string;
			}>>;
	SUBTITLES: Record<string, Record<string, {
				language: string;
			}>>;
};
