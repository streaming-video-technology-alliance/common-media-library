function iso8601DurationToNumber(isoDuration: string): number {
	const hours = /(?:([.,\d]+)H)/.exec(isoDuration);
	const minutes = /(?:([.,\d]+)M)/.exec(isoDuration);
	const seconds = /(?:([.,\d]+)S)/.exec(isoDuration);

	let duration = 0;
	if (hours) {
		duration += +hours[1] * 60 * 60;
	}
	if (minutes) {
		duration += +minutes[1] * 60;
	}
	if (seconds) {
		duration += +seconds[1];
	}
	return duration;
}

function parseDurationMpd(duration: number): string {
	const hours = Math.floor(duration / 3600);
	const minutes = Math.floor((duration % 3600) / 60);
	const seconds = duration % 60;
	if (hours > 0) {
		return `PT${hours}H${minutes}M${seconds}S`;
	} else if (minutes > 0) {
		return `PT${minutes}M${seconds}S`;
	}
	return `PT${seconds}S`;
}

export { iso8601DurationToNumber, parseDurationMpd };
