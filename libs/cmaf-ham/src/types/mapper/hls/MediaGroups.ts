/**
 * HLS Media Groups
 *
 * @alpha
 */
export type MediaGroups = {
	AUDIO: Record<
		string,
		Record<
			string,
			{
				language: string
				uri?: string
			}
		>
	>
	SUBTITLES: Record<
		string,
		Record<
			string,
			{
				language: string
				uri: string
			}
		>
	>
}
