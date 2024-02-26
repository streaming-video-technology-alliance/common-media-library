import { parseString } from 'xml2js';
import { DashManifest } from '../../utils/dash/DashManifest.js';
import { Manifest } from '../../utils/types/index.js';
import { Presentation } from '../types/model/index.js';
import { IMapper } from './IMapper.js';
import { mapMpdToHam } from '../hamMapper.js';

export class MPDMapper implements IMapper {
	xmlToJson(raw: string, replace: (manifest: DashManifest) => void): void {
		return parseString(raw, (err: Error | null, result: DashManifest) => {
			if (err) {
				throw new Error(err.message);
			}
			replace(result);
		});
	}
	toHam(manifest: Manifest): Presentation[] {
		let dashManifest: DashManifest | undefined;
		this.xmlToJson(
			manifest.main,
			(result: DashManifest) => (dashManifest = result),
		);

		if (!dashManifest) {
			return [];
		}

		const presentation = mapMpdToHam(dashManifest);

		return [presentation];
	}

	toManifest(presentation: Presentation[]): Manifest {
		console.log(presentation);
		throw new Error('Not implemented');
	}
}
