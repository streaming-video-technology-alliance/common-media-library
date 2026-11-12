#!/usr/bin/env bash
# Measures the implementation of the RFC against a base commit.
# `variants.ts` and `measure.sh` measured sketches before the implementation existed.
# This script bundles the real source of libs/iso-bmff/src with the same bundler options.
# Usage, from the repo root:
#   bash plans/uint64-reader-config/size/real.sh <directory> [base commit, default origin/main]
# <directory> must be outside the repo, so that `@svta/cml-utils` does not resolve and stays external.
# Columns: minified bytes, gzip -9 bytes, brotli quality 11 bytes, then the growth over the base of the group.
set -euo pipefail
dir=$1
base=${2:-origin/main}
rm -rf "$dir"
mkdir -p "$dir/base" "$dir/real"

git archive "$base" libs/iso-bmff/src | tar -x -C "$dir/base" --strip-components=3
cp -R libs/iso-bmff/src/. "$dir/real"

view="export { IsoBoxReadView } from './IsoBoxReadView.ts'"
write="export { IsoBoxWriteView } from './IsoBoxWriteView.ts'"
bigint="export * from './readInt64AsBigInt.ts'"
overflow="export * from './createInt64OverflowReader.ts'"

for side in base real; do
	echo "$view" > "$dir/$side/entryView.ts"
	echo "$write" > "$dir/$side/entryWrite.ts"
	echo "export { readTfdt } from './readers/readTfdt.ts'" > "$dir/$side/entryReadTfdt.ts"
	echo "export { writeTfdt } from './writers/writeTfdt.ts'" > "$dir/$side/entryWriteTfdt.ts"
	echo "export { defaultReaderConfig } from './readers/defaultReaderConfig.ts'" > "$dir/$side/entryDefaultReaders.ts"
done
printf '%s\n%s\n' "$view" "$bigint" > "$dir/real/entryBigint.ts"
printf '%s\n%s\n' "$view" "$overflow" > "$dir/real/entryOverflow.ts"
printf '%s\n%s\n%s\n' "$view" "$bigint" "$overflow" > "$dir/real/entryBoth.ts"

pack() { # label, entry
	node_modules/.bin/vp pack --no-config --minify -f esm --platform browser \
		--deps.never-bundle @svta/cml-utils -l silent -d "$dir/out/$1" "$dir/$2" > /dev/null 2>&1
	# vp pack writes the entry name into the source map comment. Remove the comment before the count.
	grep -v '^//# sourceMappingURL' "$dir/out/$1/"*.js > "$dir/out/$1.js"
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
pack baseView base/entryView.ts
pack view real/entryView.ts
pack viewBigint real/entryBigint.ts
pack viewOverflow real/entryOverflow.ts
pack viewBoth real/entryBoth.ts
report baseView view viewBigint viewOverflow viewBoth

# The write view. Every bundle contains IsoBoxWriteView.
echo
pack baseWrite base/entryWrite.ts
pack write real/entryWrite.ts
report baseWrite write

# One reader and one writer of an affected box, each with its view.
echo
pack baseReadTfdt base/entryReadTfdt.ts
pack readTfdt real/entryReadTfdt.ts
report baseReadTfdt readTfdt
echo
pack baseWriteTfdt base/entryWriteTfdt.ts
pack writeTfdt real/entryWriteTfdt.ts
report baseWriteTfdt writeTfdt

# The default reader configuration: the read view and every reader.
echo
pack baseDefaultReaders base/entryDefaultReaders.ts
pack defaultReaders real/entryDefaultReaders.ts
report baseDefaultReaders defaultReaders
