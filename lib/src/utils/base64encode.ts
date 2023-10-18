export function base64encode(binary: Uint8Array) {
	return btoa(String.fromCharCode(...binary));
}
