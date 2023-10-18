export function base64decode(str: string) {
	return new Uint8Array([...atob(str)].map((a) => a.charCodeAt(0)));
}
