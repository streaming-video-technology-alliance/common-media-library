import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'

export function createWriterConfig(config?: Partial<IsoBoxWriteViewConfig>): Required<IsoBoxWriteViewConfig> {
	return {
		writers: config?.writers ?? {},
	}
}
