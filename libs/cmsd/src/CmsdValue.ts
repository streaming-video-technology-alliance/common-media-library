import type { SfToken } from '@svta/cml-structured-field-values'
import type { CmsdObjectType } from './CmsdObjectType.ts'
import type { CmsdStreamType } from './CmsdStreamType.ts'
import type { CmsdStreamingFormat } from './CmsdStreamingFormat.ts'

/**
 * CMSD Value
 *
 *
 * @beta
 */
export type CmsdValue = CmsdObjectType | CmsdStreamingFormat | CmsdStreamType | string | number | boolean | symbol | SfToken;
