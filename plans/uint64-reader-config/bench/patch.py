"""Creates the benchmark variants from the built package.

Usage, from the repo root after `npm run build -w libs/iso-bmff`:

    python3 plans/int64-reader-config/bench/patch.py <output directory>

The script copies `libs/iso-bmff/dist/index.js` to `base.js` in the output
directory and writes three patched copies next to it. The output directory
needs a `package.json` with `"type": "module"` and a `node_modules` link to
the repo root `node_modules`, so that the `@svta/cml-utils` import resolves.
"""
import pathlib
import sys

out = pathlib.Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
dist = pathlib.Path(__file__).resolve().parents[3] / 'libs/iso-bmff/dist/index.js'
base = dist.read_text()
(out / 'base.js').write_text(base)

DISPATCH_OLD = """				case UINT:
					result = readUint(dataView, offset, size);
					break;"""
assert DISPATCH_OLD in base

# A: the branch lives in the read dispatch. Readers unchanged. Version 0 fields stay number.
a = base.replace(DISPATCH_OLD, """				case UINT:
					result = size === 8 && this.config.int64 === "bigint" ? dataView.getBigUint64(offset - dataView.byteOffset) : readUint(dataView, offset, size);
					break;""")
(out / 'variantA.js').write_text(a)

READUINT_OLD = """		this.readUint = (size) => {
			return this.read(UINT, size);
		};"""
assert READUINT_OLD in base
TFDT_OLD = "baseMediaDecodeTime: view.readUint(version == 1 ? 8 : 4)"
assert TFDT_OLD in base
SIDX_OLD = """	const earliestPresentationTime = readUint(size);
	const firstOffset = readUint(size);"""
assert SIDX_OLD in base


def patch_readers(s):
    s = s.replace(TFDT_OLD, "baseMediaDecodeTime: view.readWideUint(version == 1 ? 8 : 4)")
    s = s.replace(SIDX_OLD, """	const earliestPresentationTime = view.readWideUint(size);
	const firstOffset = view.readWideUint(size);""")
    return s


# B: a new arrow method holds the branch. One more closure per view instance.
b = base.replace(READUINT_OLD, READUINT_OLD + """
		this.readWideUint = (size) => {
			if (this.config.int64 === "bigint") return size === 8 ? this.readUint64() : BigInt(this.read(UINT, 4));
			return this.read(UINT, size);
		};""")
(out / 'variantB.js').write_text(patch_readers(b))

# C: the method is chosen in the constructor. Off: an alias of readUint, no branch and no extra closure.
c = base.replace(READUINT_OLD, READUINT_OLD + """
		this.readWideUint = config && config.int64 === "bigint" ? (size) => size === 8 ? this.readUint64() : BigInt(this.read(UINT, 4)) : this.readUint;""")
(out / 'variantC.js').write_text(patch_readers(c))

# D: a prototype method holds the branch. No closure per instance, but one more call per wide field.
PROTO_ANCHOR = """	/**
	* The buffer of the data view.
	*/
	get buffer() {"""
assert PROTO_ANCHOR in base
d = base.replace(PROTO_ANCHOR, """	readWideUint(size) {
		if (this.config.int64 === "bigint") return size === 8 ? this.readUint64() : BigInt(this.read(UINT, 4));
		return this.read(UINT, size);
	}
""" + PROTO_ANCHOR, 1)
(out / 'variantD.js').write_text(patch_readers(d))

for name in ['base.js', 'variantA.js', 'variantB.js', 'variantC.js', 'variantD.js']:
    print(name, len((out / name).read_text()), 'bytes')
