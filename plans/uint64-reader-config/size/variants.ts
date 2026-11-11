// Writes the source variants for the size measurement of the RFC.
// Usage, from the repo root: node plans/uint64-reader-config/size/variants.ts <output directory>
// The script copies libs/iso-bmff/src to <output directory>/base and writes one patched copy per variant.
// Every entry file exports IsoBoxReadView, so each bundle is the view class plus the code of the variant.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const out = process.argv[2]
if (!out) {
	throw new Error('Usage: node variants.ts <output directory>')
}

const src = join(import.meta.dirname, '../../../libs/iso-bmff/src')
mkdirSync(out, { recursive: true })
cpSync(src, join(out, 'base'), { recursive: true })

const base = readFileSync(join(out, 'base/IsoBoxReadView.ts'), 'utf8')
const FIELD_ANCHOR = '\tprivate truncated: boolean = false\n'
const CTOR_ANCHOR = '\t\tthis.config = config || {}\n'
if (!base.includes(FIELD_ANCHOR) || !base.includes(CTOR_ANCHOR)) {
	throw new Error('IsoBoxReadView.ts changed. Update the anchors.')
}

const fields = '\treadWideUint: (size: 4 | 8) => any\n\treadWideInt: (size: 4 | 8) => any\n'
const VIEW_EXPORT = "export { IsoBoxReadView } from './IsoBoxReadView.ts'\n"

function writeVariant(name: string, constructorBlock: string): void {
	cpSync(join(out, 'base'), join(out, name), { recursive: true })
	const source = base
		.replace(FIELD_ANCHOR, FIELD_ANCHOR + fields)
		.replace(CTOR_ANCHOR, CTOR_ANCHOR + constructorBlock)
	writeFileSync(join(out, name, 'IsoBoxReadView.ts'), source)
	writeFileSync(join(out, name, 'entry.ts'), VIEW_EXPORT)
}

writeFileSync(join(out, 'base/entry.ts'), VIEW_EXPORT)

// ---------- the proposal: the option holds a function ----------

writeVariant(
	'proposal',
	`\t\tconst { int64 } = this.config as any
\t\tif (int64) {
\t\t\tthis.readWideUint = (size) => int64(this, size, false)
\t\t\tthis.readWideInt = (size) => int64(this, size, true)
\t\t} else {
\t\t\tthis.readWideUint = this.readUint
\t\t\tthis.readWideInt = this.readInt
\t\t}
`,
)

const bigintFunction = (
	check: boolean,
): string => `import type { IsoBoxReadView } from './IsoBoxReadView.ts'
export function readInt64AsBigInt(view: IsoBoxReadView, size: 4 | 8, signed: boolean): bigint {
${
	check
		? `\tif (typeof BigInt !== 'function') {
\t\tthrow new TypeError('readInt64AsBigInt needs BigInt, and this runtime has no BigInt')
\t}
`
		: ''
}\tif (size === 8) {
\t\tconst value = view.readUint64()
\t\treturn signed ? BigInt.asIntN(64, value) : value
\t}
\treturn BigInt(signed ? view.readInt(size) : view.readUint(size))
}
`

const overflowFunction = (
	value: boolean,
): string => `import type { IsoBoxReadView } from './IsoBoxReadView.ts'
export function createInt64OverflowReader(onOverflow: (error: RangeError) => void) {
\treturn (view: IsoBoxReadView, size: 4 | 8, signed: boolean): number => {
\t\tif (size === 8) {
\t\t\tconst high = signed ? view.readInt(4) : view.readUint(4)
\t\t\tconst low = view.readUint(4)
\t\t\tif (high > 0x1fffff || high < -0x200000) {
${
	value
		? `\t\t\t\tconst hex = (word: number) => (word >>> 0).toString(16).padStart(8, '0')
\t\t\t\tonOverflow(new RangeError(\`0x\${hex(high)}\${hex(low)} is outside the safe integer range. Use readInt64AsBigInt to read the exact value.\`))`
		: "\t\t\t\tonOverflow(new RangeError('64-bit value is outside the safe integer range'))"
}
\t\t\t}
\t\t\treturn high * 4294967296 + low
\t\t}
\t\treturn signed ? view.readInt(size) : view.readUint(size)
\t}
}
`

const proposal = join(out, 'proposal')
writeFileSync(join(proposal, 'bigint.ts'), bigintFunction(true))
writeFileSync(join(proposal, 'bigintNoCheck.ts'), bigintFunction(false))
writeFileSync(join(proposal, 'overflow.ts'), overflowFunction(true))
writeFileSync(join(proposal, 'overflowShort.ts'), overflowFunction(false))
const functionEntries: Record<string, string[]> = {
	entryBigint: ['bigint'],
	entryBigintNoCheck: ['bigintNoCheck'],
	entryOverflow: ['overflow'],
	entryOverflowShort: ['overflowShort'],
	entryBoth: ['bigint', 'overflow'],
}
for (const [entry, modules] of Object.entries(functionEntries)) {
	const lines = modules.map(module => `export * from './${module}.ts'\n`)
	writeFileSync(join(proposal, `${entry}.ts`), VIEW_EXPORT + lines.join(''))
}

// ---------- the rejected alternative: literal values, with the code in the view ----------

const bigintInView = `\t\tif (int64 === 'bigint') {
\t\t\tif (typeof BigInt !== 'function') {
\t\t\t\tthrow new TypeError("IsoBoxReadView: int64 'bigint' needs BigInt, and this runtime has no BigInt")
\t\t\t}
\t\t\tthis.readWideUint = (size) => (size === 8 ? this.readUint64() : BigInt(this.readUint(size)))
\t\t\tthis.readWideInt = (size) => {
\t\t\t\tif (size === 8) {
\t\t\t\t\tconst value = this.dataView.getBigInt64(this.cursor)
\t\t\t\t\tthis.offset += 8
\t\t\t\t\treturn value
\t\t\t\t}
\t\t\t\treturn BigInt(this.readInt(size))
\t\t\t}
\t\t}`

const alias = ` else {
\t\t\tthis.readWideUint = this.readUint
\t\t\tthis.readWideInt = this.readInt
\t\t}
`

const overflowInView = (
	guard: string,
	report: string,
	message: string,
): string => ` else if (${guard}) {
\t\t\tconst checked = (name: string, signed: boolean) => (size: 4 | 8) => {
\t\t\t\tif (size === 8) {
\t\t\t\t\tconst { dataView, cursor } = this
\t\t\t\t\tconst high = signed ? dataView.getInt32(cursor) : dataView.getUint32(cursor)
\t\t\t\t\tif (high > 0x1fffff || high < -0x200000) {
${message}
${report}
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\treturn signed ? this.readInt(size) : this.readUint(size)
\t\t\t}
\t\t\tthis.readWideUint = checked('readWideUint', false)
\t\t\tthis.readWideInt = checked('readWideInt', true)
\t\t}`

const valueMessage = `\t\t\t\t\t\tconst hex = (word: number) => (word >>> 0).toString(16).padStart(8, '0')
\t\t\t\t\t\tconst error = new RangeError(
\t\t\t\t\t\t\t\`\${name}: 0x\${hex(high)}\${hex(dataView.getUint32(cursor + 4))} is outside the safe integer range. Set int64 to 'bigint' to read the exact value.\`,
\t\t\t\t\t\t)`
const shortMessage =
	'\t\t\t\t\t\tconst error = new RangeError(`${name}: value is outside the safe integer range`)'
const literalReport = `\t\t\t\t\t\tif (int64Overflow === 'throw') {
\t\t\t\t\t\t\tthrow error
\t\t\t\t\t\t}
\t\t\t\t\t\tint64Overflow(error)`
const functionReport = '\t\t\t\t\t\tint64Overflow(error)'
const head = '\t\tconst { int64, int64Overflow } = this.config as any\n'
const literalGuard = "int64Overflow && int64Overflow !== 'ignore'"

// The bigint mode only, with no overflow option.
writeVariant('inViewBigint', '\t\tconst { int64 } = this.config as any\n' + bigintInView + alias)
// 'ignore' | 'throw' | function, and a message with the value in hexadecimal.
writeVariant(
	'inViewLiteral',
	head + bigintInView + overflowInView(literalGuard, literalReport, valueMessage) + alias,
)
// Function only.
writeVariant(
	'inViewFunction',
	head + bigintInView + overflowInView('int64Overflow', functionReport, valueMessage) + alias,
)
// Literal union, and a short message without the value.
writeVariant(
	'inViewLiteralShort',
	head + bigintInView + overflowInView(literalGuard, literalReport, shortMessage) + alias,
)
// Function only, and a short message.
writeVariant(
	'inViewFunctionShort',
	head + bigintInView + overflowInView('int64Overflow', functionReport, shortMessage) + alias,
)

// ---------- the write view ----------

const writeBase = readFileSync(join(out, 'base/IsoBoxWriteView.ts'), 'utf8')
const WRITE_ANCHOR = '\t/**\n\t * Writes a string to the data view.\n'
if (!writeBase.includes(WRITE_ANCHOR)) {
	throw new Error('IsoBoxWriteView.ts changed. Update the anchor.')
}
const WRITE_VIEW_EXPORT = "export { IsoBoxWriteView } from './IsoBoxWriteView.ts'\n"
writeFileSync(join(out, 'base/entryWrite.ts'), WRITE_VIEW_EXPORT)

// The body of the two wide write functions. `target` is `this` for a field of the view
// and `writer` for a function outside the view.
const wideUintBody = (
	target: string,
	indent: string,
): string => `${indent}if (typeof value !== 'bigint') {
${indent}\t${target}.writeUint(value, size)
${indent}} else if (size === 8) {
${indent}\t${target}.writeUint64(value)
${indent}} else {
${indent}\tif (BigInt.asUintN(32, value) !== value) {
${indent}\t\tthrow new RangeError(\`writeWideUint: value must be in the range 0 to 2^32 - 1, received \${value}\`)
${indent}\t}
${indent}\t${target}.writeUint(Number(value), 4)
${indent}}
`

const wideIntBody = (
	target: string,
	indent: string,
	write64: string,
): string => `${indent}if (typeof value !== 'bigint') {
${indent}\t${target}.writeInt(value, size)
${indent}} else {
${indent}\tif (BigInt.asIntN(size * 8, value) !== value) {
${indent}\t\tthrow new RangeError(\`writeWideInt: value must fit in \${size} bytes, received \${value}\`)
${indent}\t}
${indent}\tif (size === 8) {
${write64}
${indent}\t} else {
${indent}\t\t${target}.writeInt(Number(value), 4)
${indent}\t}
${indent}}
`

// The wide write methods as fields of the view, as the RFC describes them.
const wideWriteFields = `\twriteWideUint = (value: number | bigint, size: 4 | 8): void => {
${wideUintBody('this', '\t\t')}\t}

\twriteWideInt = (value: number | bigint, size: 4 | 8): void => {
${wideIntBody('this', '\t\t', '\t\t\t\tthis.dataView.setBigInt64(this.cursor, value)\n\t\t\t\tthis.cursor += 8')}\t}

`
cpSync(join(out, 'base'), join(out, 'writeInView'), { recursive: true })
writeFileSync(
	join(out, 'writeInView/IsoBoxWriteView.ts'),
	writeBase.replace(WRITE_ANCHOR, wideWriteFields + WRITE_ANCHOR),
)

// The alternative: two functions outside the view. A function ships only with a writer that imports it.
const writeFunctions = join(out, 'writeFunctions')
cpSync(join(out, 'base'), writeFunctions, { recursive: true })
const WRITER_IMPORT = "import type { IsoBoxWriteView } from './IsoBoxWriteView.ts'\n"
writeFileSync(
	join(writeFunctions, 'writeWideUint.ts'),
	`${WRITER_IMPORT}export function writeWideUint(writer: IsoBoxWriteView, value: number | bigint, size: 4 | 8): void {
${wideUintBody('writer', '\t')}}
`,
)
writeFileSync(
	join(writeFunctions, 'writeWideInt.ts'),
	`${WRITER_IMPORT}export function writeWideInt(writer: IsoBoxWriteView, value: number | bigint, size: 4 | 8): void {
${wideIntBody('writer', '\t', '\t\twriter.writeUint64(BigInt.asUintN(64, value))')}}
`,
)
writeFileSync(
	join(writeFunctions, 'entryUint.ts'),
	`${WRITE_VIEW_EXPORT}export * from './writeWideUint.ts'\n`,
)
writeFileSync(
	join(writeFunctions, 'entryInt.ts'),
	`${WRITE_VIEW_EXPORT}export * from './writeWideInt.ts'\n`,
)
writeFileSync(
	join(writeFunctions, 'entryBoth.ts'),
	`${WRITE_VIEW_EXPORT}export * from './writeWideUint.ts'\nexport * from './writeWideInt.ts'\n`,
)

// One function for signed and unsigned fields.
writeFileSync(
	join(writeFunctions, 'writeWide.ts'),
	`${WRITER_IMPORT}export function writeWide(writer: IsoBoxWriteView, value: number | bigint, size: 4 | 8, signed: boolean): void {
\tif (typeof value === 'bigint') {
\t\tconst bits = size * 8
\t\tif ((signed ? BigInt.asIntN(bits, value) : BigInt.asUintN(bits, value)) !== value) {
\t\t\tthrow new RangeError(\`writeWide: value must fit in \${size} bytes, received \${value}\`)
\t\t}
\t\tif (size === 8) {
\t\t\twriter.writeUint64(BigInt.asUintN(64, value))
\t\t\treturn
\t\t}
\t\tvalue = Number(value)
\t}
\tif (signed) {
\t\twriter.writeInt(value, size)
\t} else {
\t\twriter.writeUint(value, size)
\t}
}
`,
)
writeFileSync(
	join(writeFunctions, 'entryOne.ts'),
	`${WRITE_VIEW_EXPORT}export * from './writeWide.ts'\n`,
)

console.log(`variants written to ${out}`)
