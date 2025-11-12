import type { Box } from './Box.ts'
import type { BoxType } from './BoxType.ts'
import type { ContainerBox } from './ContainerBox.ts'
import type { TrackEncryptionBox } from './TrackEncryptionBox.ts'

/**
 * Scheme Information Box - 'schi' - Container
 *
 *
 * @beta
 */
export type SchemeInformationBox = ContainerBox<'schi', TrackEncryptionBox | Box<BoxType>>;
