import type { Box } from './boxes/types/Box.ts'

/**
 * A type that represents a streamable ISO BMFF box or array buffer view.
 *
 * @public
 */
export type IsoBoxStreamable = Box | ArrayBufferView;
