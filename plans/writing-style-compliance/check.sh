#!/usr/bin/env bash
# check.sh <base-ref> <file>...
#
# Compares each markdown file in the working tree with its version at <base-ref>.
# Prose is every line outside code fences and tables, with inline code spans replaced by X.
#
# Checks per file:
#   chars    no em dash and no semicolon in prose (the rule line in AGENTS.md is allowed)
#   length   no sentence over 25 words
#   abbrev   no "e.g.", "i.e.", or "vs" in prose (quoted mentions are allowed)
#   numbers  the same set of numeric tokens as the base version
#   blocks   code blocks and tables are byte for byte identical to the base version
#   links    the same set of link targets and bare URLs as the base version
#   shorter  prose word count did not grow
#
# A file with no base version gets the first three checks only.
# Exit status is 1 when any check fails.
set -u
base=$1
shift
fail=0

prose() { perl -ne 'next if /^```/ ... /^```/; next if /^\s*\|/; s/`[^`]*`/ X /g; print' "$1"; }
blocks() { perl -ne 'print if /^```/ ... /^```/ or /^\s*\|/' "$1"; }
nums() { perl -0777 -ne 's/```.*?```//gs; print "$_\n" for /\d[\d,.]*\d|\d/g' "$1" | sort -u; }
links() { perl -ne 'print "$_\n" for /\]\(([^)]+)\)/g; print "$_\n" for /(?<!\()https?:\/\/[^\s)>]+/g' "$1" | sort -u; }
sentences_over_25() {
	perl -0777 -ne '
		s/^```.*?^```[^\n]*\n?//gms;
		s/^\s*\|[^\n]*\n//gm;
		s/\A---\n.*?\n---\n//s;
		s/^#[^\n]*\n//gm;
		s/`[^`]*`/X/g;
		s/\[([^\]]*)\]\([^)]*\)/$1/g;
		s/\*\*//g;
		for my $p (split /\n\s*\n|\n(?=\s*(?:[-*]|\d+\.)\s)/) {
			$p =~ s/^\s*(?:[-*]|\d+\.)\s+//mg;
			$p =~ s/^\s*>\s?//mg;
			$p =~ s/\s+/ /g;
			for my $s (split /(?<=[.!?:])\s+(?=[A-Z"(])/, $p) {
				my $n = () = $s =~ /\S+/g;
				print "[$n] $s\n" if $n > 25;
			}
		}' "$1"
}

report() {
	if [ -z "$3" ]; then
		printf 'PASS %-8s %s\n' "$1" "$2"
	else
		printf 'FAIL %-8s %s\n%s\n' "$1" "$2" "$3"
		fail=1
	fi
}

for f in "$@"; do
	before=$(mktemp)
	hasbase=1
	if ! git show "$base:$f" > "$before" 2>/dev/null; then
		hasbase=0
		echo "SKIP base     $f (no version at $base)"
	fi

	out=$(prose "$f" | perl -ne 'print "$.: $_" if /\xE2\x80\x94|;/ and !/No semicolons \(;\) and no em dashes/')
	report chars "$f" "$out"

	out=$(sentences_over_25 "$f")
	report length "$f" "$out"

	out=$(prose "$f" | perl -ne 'print "$.: $_" if /(?<!["\x27])\b(?:e\.g\.|i\.e\.|vs\.?)(?=\W|$)/')
	report abbrev "$f" "$out"

	if [ "$hasbase" = 1 ]; then
		out=$(diff <(nums "$before") <(nums "$f") || true)
		report numbers "$f" "$out"

		out=$(diff <(blocks "$before") <(blocks "$f") || true)
		report blocks "$f" "$out"

		out=$(diff <(links "$before") <(links "$f") || true)
		report links "$f" "$out"

		wb=$(prose "$before" | wc -w | tr -d ' ')
		wa=$(prose "$f" | wc -w | tr -d ' ')
		if [ "$wa" -le "$wb" ]; then
			printf 'PASS %-8s %s (%s -> %s prose words)\n' shorter "$f" "$wb" "$wa"
		else
			printf 'FAIL %-8s %s (%s -> %s prose words)\n' shorter "$f" "$wb" "$wa"
			fail=1
		fi
	fi
	rm -f "$before"
done
exit $fail
