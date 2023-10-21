import { CmsdObjectType } from '@svta/common-media-library/cmsd/CmsdObjectType';
import { CmsdStreamType } from '@svta/common-media-library/cmsd/CmsdStreamType';
import { CmsdStreamingFormat } from '@svta/common-media-library/cmsd/CmsdStreamingFormat';

export const CMSD_STATIC_OBJ = {
	ot: CmsdObjectType.VIDEO,
	sf: CmsdStreamingFormat.HLS,
	st: CmsdStreamType.VOD,
	d: 5000,
	br: 2000,
	n: 'OriginProviderA',
};
