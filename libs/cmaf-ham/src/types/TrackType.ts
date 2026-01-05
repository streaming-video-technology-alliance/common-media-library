export const TrackType = {
	AUDIO: 'audio',
	VIDEO: 'video',
	TEXT: 'text',
	IMAGE: 'image',
} as const

export type TrackType = (typeof TrackType)[keyof typeof TrackType];
