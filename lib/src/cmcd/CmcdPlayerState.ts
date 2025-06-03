/**
 * CMCD v2 player states for the 'sta' key.
 * s: starting, 
 * p: playing, 
 * k: seeking, 
 * r: rebuffering, 
 * a: paused, 
 * w: waiting,
 * e: ended, 
 * f: fatal error
*/

export const CMCD_PLAYER_STATES = {
	STARTING: 's',
	PLAYING: 'p',
	SEEKING: 'k',
	REBUFFERING: 'r',
	PAUSED: 'a',
	WAITING: 'w',
	ENDED: 'e',
	FATAL_ERROR: 'f',
} as const;


export type CmcdPlayerState = typeof CMCD_PLAYER_STATES[keyof typeof CMCD_PLAYER_STATES];
