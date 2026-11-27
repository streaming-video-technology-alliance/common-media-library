/**
 * Compares the 16 bytes of a view at a position with a user type.
 *
 * @internal
 */
export function isUserType(view: DataView, pos: number, userType: Uint8Array): boolean {
	for (let i = 0; i < 16; i++) {
		if (view.getUint8(pos + i) !== userType[i]) {
			return false
		}
	}

	return true
}
