import { CmsdObjectType } from '@svta/common-media-library/cmsd/CmsdObjectType';
import type { CmsdStatic } from '@svta/common-media-library/cmsd/CmsdStatic';
import { CmsdStreamingFormat } from '@svta/common-media-library/cmsd/CmsdStreamingFormat';
import { CmsdStreamType } from '@svta/common-media-library/cmsd/CmsdStreamType';

export const CMSD_STATIC_OBJ: CmsdStatic = {
	ot: CmsdObjectType.VIDEO,
	sf: CmsdStreamingFormat.HLS,
	st: CmsdStreamType.VOD,
	d: 5000,
	br: 2000,
	n: 'OriginProviderA',
};
