export function numberToIso8601Duration(duration: number): string {
	const hours = Math.floor(duration / 3600);
	const minutes = Math.floor((duration % 3600) / 60);
	const seconds = duration % 60;
	if (hours > 0) {
		return `PT${hours}H${minutes}M${seconds}S`;
	}
	else if (minutes > 0) {
		return `PT${minutes}M${seconds}S`;
	}
	return `PT${seconds}S`;
}
