import type { CmsdStatic } from '@svta/cml-cmsd'
import { CmsdObjectType, CmsdStreamingFormat, CmsdStreamType } from '@svta/cml-cmsd'

export const CMSD_STATIC_OBJ: CmsdStatic = {
	ot: CmsdObjectType.VIDEO,
	sf: CmsdStreamingFormat.HLS,
	st: CmsdStreamType.VOD,
	d: 5000,
	br: 2000,
	n: 'OriginProviderA',
}
