import type { Manifest } from '../types/manifest/Manifest.ts'
import type { Presentation } from '../types/model/Presentation.ts'

import type { Mapper } from './Mapper.ts'

export class MapperContext {
	private strategy!: Mapper
	private static instance: MapperContext

	public static getInstance(): MapperContext {
		if (!MapperContext.instance) {
			MapperContext.instance = new MapperContext()
		}

		return MapperContext.instance
	}

	public setStrategy(strategy: Mapper): void {
		this.strategy = strategy
	}

	public getHamFormat(manifest: Manifest): Presentation[] {
		return this.strategy.toHam(manifest)
	}

	public getManifestFormat(presentation: Presentation[]): Manifest {
		return this.strategy.toManifest(presentation)
	}

	public getManifestMetadata(): JSON | undefined {
		return this.strategy.getManifestMetadata()
	}
}
