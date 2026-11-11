#!/usr/bin/env bash
# Bundles every variant with the repository bundler and prints the sizes.
# Usage, from the repo root, after `node plans/uint64-reader-config/size/variants.ts <directory>`:
#   bash plans/uint64-reader-config/size/measure.sh <directory>
# <directory> must be outside the repo, so that `@svta/cml-utils` does not resolve and stays external.
# Columns: minified bytes, gzip -9 bytes, brotli quality 11 bytes, then the growth over the base of the group.
set -euo pipefail
dir=$1
rm -rf "$dir/out"

pack() { # label, entry
	node_modules/.bin/vp pack --no-config --minify -f esm --platform browser \
		--deps.never-bundle @svta/cml-utils -l silent -d "$dir/out/$1" "$dir/$2" > /dev/null 2>&1
	# vp pack writes the entry name into the source map comment. Remove the comment before the count.
	grep -v '^//# sourceMappingURL' "$dir/out/$1/"*.js > "$dir/out/$1.js"
	if [ "$(grep -c 'from"@svta/cml-utils"' "$dir/out/$1.js")" != 1 ]; then
		echo "$1: @svta/cml-utils is not external" >&2
		exit 1
	fi
}

size() {
	printf '%s %s %s' "$(wc -c < "$1" | tr -d ' ')" "$(gzip -9 < "$1" | wc -c | tr -d ' ')" "$(brotli -q 11 -c < "$1" | wc -c | tr -d ' ')"
}

report() { # the base label, then the other labels of the group
	local base=$1 label m g b bm bg bb
	read -r bm bg bb <<< "$(size "$dir/out/$base.js")"
	printf '%-24s %6s %6s %6s | %5s %5s %5s\n' variant min gzip brotli +min +gzip +br
	for label in "$@"; do
		read -r m g b <<< "$(size "$dir/out/$label.js")"
		printf '%-24s %6s %6s %6s | %5s %5s %5s\n' "$label" "$m" "$g" "$b" $((m - bm)) $((g - bg)) $((b - bb))
	done
}

# The read view. Every bundle contains IsoBoxReadView.
pack base base/entry.ts
pack proposal proposal/entry.ts
pack proposalBigint proposal/entryBigint.ts
pack proposalBigintNoCheck proposal/entryBigintNoCheck.ts
pack proposalOverflow proposal/entryOverflow.ts
pack proposalOverflowShort proposal/entryOverflowShort.ts
pack proposalBoth proposal/entryBoth.ts
pack inViewBigint inViewBigint/entry.ts
pack inViewLiteral inViewLiteral/entry.ts
pack inViewFunction inViewFunction/entry.ts
pack inViewLiteralShort inViewLiteralShort/entry.ts
pack inViewFunctionShort inViewFunctionShort/entry.ts
report base proposal proposalBigint proposalBigintNoCheck proposalOverflow proposalOverflowShort proposalBoth \
	inViewBigint inViewLiteral inViewFunction inViewLiteralShort inViewFunctionShort

# The write view. Every bundle contains IsoBoxWriteView.
echo
pack writeBase base/entryWrite.ts
pack writeInView writeInView/entryWrite.ts
pack writeFunctionsUint writeFunctions/entryUint.ts
pack writeFunctionsInt writeFunctions/entryInt.ts
pack writeFunctionsBoth writeFunctions/entryBoth.ts
pack writeFunctionsOne writeFunctions/entryOne.ts
report writeBase writeInView writeFunctionsUint writeFunctionsInt writeFunctionsBoth writeFunctionsOne
