#!/usr/bin/env bash
# Runs the second benchmark series of the RFC. One process per run.
# Usage, inside the output directory of patch.ts, with bench.ts copied next to the variants:
#   bash series.sh <rounds>
set -euo pipefail
rounds=${1:-12}
for _ in $(seq 1 "$rounds"); do
	node bench.ts variantC.js bigint
	node bench.ts variantE.js bigint
	SAFE=1 node bench.ts base.js
	SAFE=1 node bench.ts variantF.js checked
	SAFE=1 node bench.ts variantE.js checked
	node bench.ts variantF.js checked
	node bench.ts variantE.js checked
done
