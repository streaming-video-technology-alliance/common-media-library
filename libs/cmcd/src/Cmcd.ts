import type { CmcdEvent } from './CmcdEvent.ts'
import type { CmcdRequest } from './CmcdRequest.ts'
import type { CmcdResponse } from './CmcdResponse.ts'

/**
 * Common Media Client Data (CMCD) version 2.
 *
 * A standardized set of HTTP request header fields, query string parameters,
 * and event reporting fields for communicating media playback metrics.
 *
 * This type is the intersection of {@link CmcdRequest}, {@link CmcdResponse},
 * and {@link CmcdEvent}, combining all keys from all reporting modes.
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html | CTA-5004-B CMCD v2 Spec}
 * @see {@link https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf|CMCD v1 Spec}
 *
 * @public
 */
export type Cmcd = CmcdRequest & CmcdResponse & CmcdEvent;
