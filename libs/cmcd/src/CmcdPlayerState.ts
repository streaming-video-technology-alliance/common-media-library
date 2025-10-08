import type { ValueOf } from '@svta/cml-utils/ValueOf.js';

/**
 * CMCD v2 player states for the 'sta' key.
 *
 *
 * @enum
 *
 * @beta
 */
export const CmcdPlayerState = {
	/**
	 * Starting: Initial startup of the player.
	 */
	STARTING: 's',

	/**
	 * Playing: The player is actively rendering content.
	 */
	PLAYING: 'p',

	/**
	 * Seeking: The player is seeking to a new position.
	 */
	SEEKING: 'k',

	/**
	 * Rebuffering: The player is buffering data during playback.
	 */
	REBUFFERING: 'r',

	/**
	 * Paused: The player is paused.
	 */
	PAUSED: 'a',

	/**
	 * Waiting: The player is waiting for a user action or another event.
	 */
	WAITING: 'w',

	/**
	 * Ended: The media has finished playing.
	 */
	ENDED: 'e',

	/**
	 * Fatal Error: The player has encountered a fatal error.
	 */
	FATAL_ERROR: 'f',

	/**
	 * Quit: User initiated end of playback before media asset completion.
	 */
	QUIT: 'q',

	/**
	 * Preloading: The player is loading assets ahead of starting in order to provide a fast startup. The expectation is that playback will commence at a future time.
	 */
	PRELOADING: 'd',
} as const;

/**
 * @beta
 */
export type CmcdPlayerState = ValueOf<typeof CmcdPlayerState>;
