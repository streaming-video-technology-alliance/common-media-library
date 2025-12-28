import type { Box } from './boxes/Box.ts'
import type { IsoBox } from './boxes/IsoBox.ts'

/**
 * A type that represents a streamable ISO BMFF box or array buffer view.
 *
 * @public
 */
export type IsoBoxStreamable = IsoBox | Box | ArrayBufferView;
