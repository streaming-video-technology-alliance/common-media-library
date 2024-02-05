// @ts-ignore
import { parse } from 'mpd-parser';

export function parseMpd(text: string, uri: string) {
	const parsedDash = parse(text, { uri });

	if (!parsedDash) {
		throw new Error();
	}

	return parsedDash;
}
