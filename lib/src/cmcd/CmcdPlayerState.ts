/**
 * CMCD v2 player states for the 'sta' key.
 * s: starting, p: playing, k: seeking, r: rebuffering, a: paused, w: waiting,
 * e: ended, f: fatal error
 */
export type CmcdPlayerState =
  | 's' // starting
  | 'p' // playing
  | 'k' // seeking
  | 'r' // rebuffering
  | 'a' // paused
  | 'w' // waiting
  | 'e' // ended
  | 'f'; // fatal error
