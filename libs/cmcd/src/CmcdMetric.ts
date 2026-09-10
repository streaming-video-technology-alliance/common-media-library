import type { CmcdObjectType } from './CmcdObjectType.ts'

/**
 * A value that the spec allows per object type. A number applies to the whole report.
 * A record gives one value per object type, for example `{ v: 3000, a: 128 }`.
 *
 * @public
 */
export type CmcdMetric = number | Readonly<Partial<Record<CmcdObjectType, number>>>
