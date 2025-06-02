import type { CmcdV2Object } from './CmcdV2Object';
import type { CmcdV2Request } from './CmcdV2Request';
import type { CmcdV2Event } from './CmcdV2Event';
import type { CmcdV2Response } from './CmcdV2Response';
import type { CmcdReportingEvent } from './CmcdReportingEvent';
import type { CmcdPlayerState } from './CmcdPlayerState';

/**
 * Full CMCD v2 type
 */
export type CmcdV2 = CmcdV2Object &
  CmcdV2Request &
  CmcdV2Event &
  CmcdV2Response &
  CmcdReportingEvent &
  CmcdPlayerState;
