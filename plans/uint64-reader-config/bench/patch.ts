// Writes benchmark variants C, E, and F from the built package.
// Usage, from the repo root after `npm run build -w libs/iso-bmff`:
//   node plans/uint64-reader-config/bench/patch.ts <output directory>
// The output directory needs a `package.json` with `"type": "module"` and a `node_modules` link
// to the repo root `node_modules`, so that the `@svta/cml-utils` import resolves.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const out = process.argv[2]
if (!out) {
	throw new Error('Usage: node patch.ts <output directory>')
}
mkdirSync(out, { recursive: true })

const base = readFileSync(join(import.meta.dirname, '../../../libs/iso-bmff/dist/index.js'), 'utf8')

function anchor(part: string): string {
	if (!base.includes(part)) {
		throw new Error(`The built package changed. Anchor missing: ${part.slice(0, 60)}`)
	}
	return part
}

const READUINT = anchor(`		this.readUint = (size) => {
			return this.read(UINT, size);
		};`)
const TFDT = anchor('baseMediaDecodeTime: view.readUint(version == 1 ? 8 : 4)')
const SIDX = anchor(`	const earliestPresentationTime = readUint(size);
	const firstOffset = readUint(size);`)

function patchReaders(source: string): string {
	return source
		.replace(TFDT, 'baseMediaDecodeTime: view.readWideUint(version == 1 ? 8 : 4)')
		.replace(
			SIDX,
			`	const earliestPresentationTime = view.readWideUint(size);
	const firstOffset = view.readWideUint(size);`,
		)
}

function write(name: string, source: string): void {
	writeFileSync(join(out, name), source)
	console.log(name, source.length, 'bytes')
}

write('base.js', base)

// C: the constructor chooses the method. Off: an alias of readUint. On: a closure in the view reads a bigint.
write(
	'variantC.js',
	patchReaders(
		base.replace(
			READUINT,
			`${READUINT}
		this.readWideUint = config && config.int64 === "bigint" ? (size) => size === 8 ? this.readUint64() : BigInt(this.read(UINT, 4)) : this.readUint;`,
		),
	),
)

// E: the proposal. The option holds a function. Off: an alias of readUint. On: a closure calls the function.
const functions = `
export function readInt64AsBigInt(view, size, signed) {
	if (typeof BigInt !== "function") throw new TypeError("readInt64AsBigInt needs BigInt, and this runtime has no BigInt");
	if (size === 8) {
		const value = view.readUint64();
		return signed ? BigInt.asIntN(64, value) : value;
	}
	return BigInt(signed ? view.readInt(size) : view.readUint(size));
}
export function createInt64OverflowReader(onOverflow) {
	return (view, size, signed) => {
		if (size === 8) {
			const high = signed ? view.readInt(4) : view.readUint(4);
			const low = view.readUint(4);
			if (high > 2097151 || high < -2097152) {
				const hex = (word) => (word >>> 0).toString(16).padStart(8, "0");
				onOverflow(new RangeError(\`0x\${hex(high)}\${hex(low)} is outside the safe integer range. Use readInt64AsBigInt to read the exact value.\`));
			}
			return high * 4294967296 + low;
		}
		return signed ? view.readInt(size) : view.readUint(size);
	};
}
`
write(
	'variantE.js',
	patchReaders(
		base.replace(
			READUINT,
			`${READUINT}
		const int64 = config && config.int64;
		this.readWideUint = int64 ? (size) => int64(this, size, false) : this.readUint;`,
		),
	) + functions,
)

// F: string values, as in an earlier draft of the RFC. The view holds the bigint read and the overflow check.
write(
	'variantF.js',
	patchReaders(
		base.replace(
			READUINT,
			`${READUINT}
		const { int64, int64Overflow } = config || {};
		this.readWideUint = int64 === "bigint" ? (size) => size === 8 ? this.readUint64() : BigInt(this.read(UINT, 4)) : int64Overflow && int64Overflow !== "ignore" ? (size) => {
			if (size === 8) {
				const { dataView, cursor } = this;
				const high = dataView.getUint32(cursor);
				if (high > 2097151) {
					const hex = (word) => (word >>> 0).toString(16).padStart(8, "0");
					const error = new RangeError(\`readWideUint: 0x\${hex(high)}\${hex(dataView.getUint32(cursor + 4))} is outside the safe integer range. Set int64 to 'bigint' to read the exact value.\`);
					if (int64Overflow === "throw") throw error;
					int64Overflow(error);
				}
			}
			return this.readUint(size);
		} : this.readUint;`,
		),
	),
)
