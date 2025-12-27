export function getReaderName(reader: { name: string }): string {
	return reader.name.toLowerCase().replace('read', '')
}
