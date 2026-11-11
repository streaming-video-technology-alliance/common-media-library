// Type-level spike for the `int64` reader option (RFC: rfc/uint64-reader-config.md).
// A reduced model of the iso-bmff type plumbing. Nothing here is imported by libs/.
// The real package has 11 affected box types, 8 affected container types, 65 readers, and 2 reader factories.
// The model keeps one of each kind: tfdt (affected), mfhd (not affected), traf (container), and one factory.
// The option holds a function. The return type of the function is the type of every 64-bit field.

// ---------- the option ----------

/** The JavaScript type of a 64-bit integer field. */
export type IsoInt64 = number | bigint

/**
 * The value of the `int64` option. The view calls the function for every 64-bit field
 * that a built-in reader reads. The return type is the type of those fields.
 */
export type IsoInt64Reader<V extends IsoInt64 = number> = (
	view: IsoBoxReadView<IsoInt64>,
	size: 4 | 8,
	signed: boolean,
) => V

// ---------- box types ----------

export type FullBox = { version: number; flags: number }
export type Box<T extends string = never> = { type: T }

/** Affected box. The 64-bit field follows the option. */
export type TrackFragmentBaseMediaDecodeTimeBox<V extends IsoInt64 = number> = FullBox & {
	type: 'tfdt'
	baseMediaDecodeTime: V
}

/** Unaffected box. No type parameter. */
export type MovieFragmentHeaderBox = FullBox & {
	type: 'mfhd'
	sequenceNumber: number
}

/** Container of an affected box. The parameter flows through the child union. */
export type TrackFragmentBoxChild<V extends IsoInt64 = number> =
	| TrackFragmentBaseMediaDecodeTimeBox<V>
	| MovieFragmentHeaderBox

export type TrackFragmentBox<V extends IsoInt64 = number> = {
	type: 'traf'
	boxes: TrackFragmentBoxChild<V>[]
}

export type IsoBoxMap<V extends IsoInt64 = number> = {
	mfhd: MovieFragmentHeaderBox
	tfdt: TrackFragmentBaseMediaDecodeTimeBox<V>
	traf: TrackFragmentBox<V>
}

export type IsoBox<V extends IsoInt64 = number> = IsoBoxMap<V>[keyof IsoBoxMap<V>]

export type ParsedBox<T = Box, V extends IsoInt64 = number> = (T extends IsoBox<V>
	? T & Omit<Box, 'type'>
	: T) & {
	view: IsoBoxReadView<V>
	size: number
	largesize?: number
}

export type ParsedIsoBox<V extends IsoInt64 = number> = ParsedBox<IsoBox<V> | Box, V>

export type IsoTypedParsedBox<T extends keyof IsoBoxMap, V extends IsoInt64 = number> = ParsedBox<
	IsoBoxMap<V>[T],
	V
>

// ---------- readers and config ----------

/**
 * The reader of one box. The third parameter is the field type of the view that the reader
 * accepts. The default keeps `IsoBoxReader<B, T>` equal to today's type.
 */
export type IsoBoxReader<B = unknown, T extends string = string, V extends IsoInt64 = number> = (
	view: IsoBoxReadView<V>,
	type: T,
) => B

/**
 * The map has one signature, so an inline reader gets its `view` parameter from context
 * in both modes, and a generic built-in reader is instantiated with the field type of the call.
 */
export type IsoBoxReaderMap<V extends IsoInt64 = number> = Record<
	string,
	IsoBoxReader<unknown, string, V>
>

/**
 * `int64` is optional for `number`, the default, and required for `bigint`.
 * A type that promises `bigint` fields therefore needs the function that produces them.
 * `NoInfer` stops inference of `V` from the readers, so `V` comes from `int64` only.
 */
export type IsoBoxReadViewConfig<V extends IsoInt64 = number> = {
	readers?: NoInfer<IsoBoxReaderMap<V>>
} & ([V] extends [bigint] ? { int64: IsoInt64Reader<V> } : { int64?: IsoInt64Reader<V> })

// ---------- the view (declaration only) ----------

// The members are properties, not methods, because the class uses arrow-function fields.
export declare class IsoBoxReadView<V extends IsoInt64 = number> {
	/**
	 * The stored readers use the default instantiation, and `V` appears in a return position
	 * only. `IsoBoxReadView<bigint>` is therefore assignable to `IsoBoxReadView<IsoInt64>`.
	 */
	private config: { readers?: IsoBoxReaderMap; int64?: IsoInt64Reader<V> }
	/** The configuration is optional for the default mode and required for `bigint`. */
	constructor(
		raw: ArrayBuffer,
		...config: [V] extends [bigint]
			? [config: IsoBoxReadViewConfig<V>]
			: [config?: IsoBoxReadViewConfig<V>]
	)
	readUint: (size: number) => number
	readInt: (size: number) => number
	readUint64: () => bigint
	readFullBox: () => FullBox
	/** Reads a 4 or 8 byte unsigned field as the type that the `int64` option returns. */
	readWideUint: (size: 4 | 8) => V
	/** The signed form. */
	readWideInt: (size: 4 | 8) => V
	slice: (offset: number, size: number) => IsoBoxReadView<V>;
	[Symbol.iterator](): Generator<ParsedIsoBox<V>>
}

// ---------- the exported functions for the option ----------

/** Reads the field as a `bigint`. */
export declare function readInt64AsBigInt(
	view: IsoBoxReadView<IsoInt64>,
	size: 4 | 8,
	signed: boolean,
): bigint

/** Reads the field as a `number` and reports a value outside the safe integer range. */
export declare function createInt64OverflowReader(
	onOverflow: (error: RangeError) => void,
): IsoInt64Reader<number>

// ---------- the return type ----------

/**
 * A generic reader that is read from a variable is not instantiated by the call. Its return
 * type is then the built-in box of either mode. This type gives that box the mode of the call.
 */
export type IsoBoxOfMode<B, V extends IsoInt64> = B extends {
	type: infer T extends keyof IsoBoxMap
}
	? [B] extends [IsoBoxMap<IsoInt64>[T]]
		? [IsoBoxMap<IsoInt64>[T]] extends [B]
			? IsoBoxMap<V>[T]
			: B
		: B
	: B

/**
 * The default union covers the boxes that have no reader in `R`. The model uses `keyof R`
 * for the exclusion. The package type of #614 also handles optional and aliased keys.
 */
export type IsoBoxReaderReturn<R, V extends IsoInt64 = number> =
	| {
			[K in keyof R]: R[K] extends (...args: never[]) => infer B
				? ParsedBox<IsoBoxOfMode<B, V>, V>
				: never
	  }[keyof R]
	| ParsedBox<Exclude<IsoBox<V>, { type: keyof R }> | Box, V>

// ---------- entry points ----------

/** `V` is inferred from the return type of the `int64` function. The default is `number`. */
export declare function readIsoBoxes<
	const R extends IsoBoxReaderMap<V>,
	V extends IsoInt64 = number,
>(raw: ArrayBuffer, config: IsoBoxReadViewConfig<V> & { readers: R }): IsoBoxReaderReturn<R, V>[]
export declare function readIsoBoxes<V extends IsoInt64 = number>(
	raw: ArrayBuffer,
	config?: IsoBoxReadViewConfig<V>,
): ParsedIsoBox<V>[]

export declare function isIsoBoxType<T extends keyof IsoBoxMap, V extends IsoInt64 = number>(
	type: T,
	box: ParsedIsoBox<V> | IsoBox<V>,
): box is IsoTypedParsedBox<T, V>

// ---------- built-in readers ----------

/** A built-in reader of an affected box is generic in `V`. */
export declare function readTfdt<V extends IsoInt64>(
	view: IsoBoxReadView<V>,
): TrackFragmentBaseMediaDecodeTimeBox<V>

/** A built-in reader of an unaffected box has no type parameter. It takes a view of either mode. */
export declare function readMfhd(view: IsoBoxReadView<IsoInt64>): MovieFragmentHeaderBox

/**
 * A reader factory returns a reader of the same form: no type parameter, and a view of either mode.
 * The real package has `createAudioSampleEntryReader` and `createVisualSampleEntryReader`.
 */
export declare function createSampleEntryReader<T extends string>(
	type: T,
): (view: IsoBoxReadView<IsoInt64>) => { type: T; dataReferenceIndex: number }

/** `defaultReaderConfig` gains an optional argument that selects the mode of the returned configuration. */
export declare function defaultReaderConfig<V extends IsoInt64 = number>(options?: {
	int64?: IsoInt64Reader<V>
}): IsoBoxReadViewConfig<V>

// ---------- writers ----------

export declare class IsoBoxWriteView {
	constructor(type: string, size: number)
	writeUint(value: number, size: number): void
	writeUint64(value: bigint): void
	writeWideUint(value: number | bigint, size: 4 | 8): void
	readonly buffer: ArrayBufferLike
}

export type IsoBoxStreamable<V extends IsoInt64 = number> =
	| IsoBox<V>
	| ParsedIsoBox<V>
	| ParsedBox<unknown, V>
	| ArrayBufferView

/** The write functions take a box of either mode. No writer option. */
export declare function writeIsoBox(box: IsoBoxStreamable<IsoInt64>): Uint8Array<ArrayBuffer>

export declare function writeTfdt(
	box: TrackFragmentBaseMediaDecodeTimeBox<IsoInt64>,
): IsoBoxWriteView
