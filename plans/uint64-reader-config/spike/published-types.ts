// The result type that the published package gives a custom tfdt reader today.
// GuideField resolves to `number | bigint`, because IsoBoxReaderReturn adds the built-in tfdt type to the union.
import { readIsoBoxes, readTfdt, type IsoBoxReadView } from '@svta/cml-iso-bmff'
declare const buffer: ArrayBuffer
const readTfdt64 = (view: IsoBoxReadView) => {
	const { version, flags } = view.readFullBox()
	const baseMediaDecodeTime = version === 1 ? view.readUint64() : BigInt(view.readUint(4))
	return { type: 'tfdt' as const, version, flags, baseMediaDecodeTime }
}
export const g = readIsoBoxes(buffer, { readers: { tfdt: readTfdt64 } })
export type Guide = Exclude<Extract<(typeof g)[number], { type: 'tfdt' }>, { type: never }>
export type GuideField = Guide['baseMediaDecodeTime']
export const b = readIsoBoxes(buffer, { readers: { tfdt: readTfdt } })
export type Builtin = Exclude<Extract<(typeof b)[number], { type: 'tfdt' }>, { type: never }>
