import type { DashManifest } from '../../types/mapper/dash/DashManifest';

export type DashSerializer = (json: DashManifest) => string;

let xmlSerializer: DashSerializer;

/**
 * @internal
 */
export function setDashSerializer(serializer: DashSerializer): void {
	xmlSerializer = serializer;
}

/**
 * @internal
 */
export function getDashSerializer(): DashSerializer {
	return xmlSerializer;
}

export function serializeDashManifest(json: DashManifest): string {
	return xmlSerializer(json);
}
