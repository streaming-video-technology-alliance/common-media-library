import { CmsdObjectType } from '@svta/cml-cmsd/CmsdObjectType';
import type { CmsdStatic } from '@svta/cml-cmsd/CmsdStatic';
import { CmsdStreamingFormat } from '@svta/cml-cmsd/CmsdStreamingFormat';
import { CmsdStreamType } from '@svta/cml-cmsd/CmsdStreamType';

export const CMSD_STATIC_OBJ: CmsdStatic = {
	ot: CmsdObjectType.VIDEO,
	sf: CmsdStreamingFormat.HLS,
	st: CmsdStreamType.VOD,
	d: 5000,
	br: 2000,
	n: 'OriginProviderA',
};
