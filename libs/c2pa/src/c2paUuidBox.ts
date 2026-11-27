import {
	createUuidReader,
	readBytes,
	type IsoBoxReadConfig,
	type IsoBoxReadCursor,
} from '@svta/cml-iso-bmff'

// C2PA manifest store user type per the C2PA specification
const C2PA_MANIFEST_USER_TYPE = 'd8fec3d6-1a96-4f32-a0f6-f3ecf96c10ea'

// JUMBF user type per ISO 19566-5 (used by c2pa-rs and other JUMBF-compliant tools)
/** @internal */
export const JUMBF_USER_TYPE = 'd8fec3d6-1b0e-483c-9297-5828877ec481'

/**
 * A C2PA `uuid` box. `data` is the body after the user type.
 *
 * @internal
 */
export type C2paUuidBox = {
	type: 'uuid'
	userType: typeof C2PA_MANIFEST_USER_TYPE | typeof JUMBF_USER_TYPE
	data: Uint8Array
}

function readC2paUuidBox(cursor: IsoBoxReadCursor, userType: C2paUuidBox['userType']): C2paUuidBox {
	return { type: 'uuid', userType, data: readBytes(cursor, cursor.end - cursor.pos) }
}

const C2PA_UUID_READERS = {
	[C2PA_MANIFEST_USER_TYPE]: readC2paUuidBox,
	[JUMBF_USER_TYPE]: readC2paUuidBox,
}

/**
 * The read configuration that parses the C2PA `uuid` boxes. The configuration does not change the result for any other box.
 *
 * @internal
 */
export const C2PA_UUID_READ_CONFIG: IsoBoxReadConfig = {
	readers: { uuid: /* @__PURE__ */ createUuidReader(C2PA_UUID_READERS) },
}

/**
 * Tests whether a box is a C2PA `uuid` box from `C2PA_UUID_READ_CONFIG`.
 *
 * @internal
 */
export function isC2paUuidBox(box: unknown): box is C2paUuidBox {
	const { type, userType } = box as Partial<C2paUuidBox>

	return type === 'uuid' && (userType === C2PA_MANIFEST_USER_TYPE || userType === JUMBF_USER_TYPE)
}

/**
 * Finds the C2PA `uuid` box in a list of boxes that `C2PA_UUID_READ_CONFIG` read.
 *
 * Matches against both the C2PA manifest store UUID and the JUMBF UUID
 * (ISO 19566-5), as different tools use different UUIDs.
 *
 * @internal
 */
export function findC2paUuidBox(boxes: readonly unknown[]): C2paUuidBox | undefined {
	return boxes.find(isC2paUuidBox)
}
