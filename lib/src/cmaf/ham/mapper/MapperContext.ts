import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../types/model/index.js';
import { IMapper } from './IMapper.js';

export class MapperContext {
	private strategy!: IMapper;
	private static instance: MapperContext;

	private constructor() {}

	public static getInstance(): MapperContext {
		if (!MapperContext.instance) {
			MapperContext.instance = new MapperContext();
		}

		return MapperContext.instance;
	}

	public setStrategy(strategy: IMapper): void {
		this.strategy = strategy;
	}

	public getHamFormat(manifest: Manifest): Presentation[] {
		return this.strategy.toHam(manifest);
	}

	public getManifestFormat(presentation: Presentation[]): Manifest {
		return this.strategy.toManifest(presentation);
	}

	public getManifestMetadata(): JSON | undefined {
		return this.strategy.getManifestMetadata();
	}
}
