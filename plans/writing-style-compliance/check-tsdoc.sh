#!/usr/bin/env bash
# check-tsdoc.sh <base-ref> <file>...
#
# Compares the TSDoc comments of each TypeScript file in the working tree with its version at <base-ref>.
# A TSDoc comment is every /** ... */ block. Prose is the comment text without fenced code blocks,
# with inline code spans, URLs, {@link} targets, and {@includeCode} tags replaced by X, and with the
# tag words (@param, @returns, @see, @public, ...) removed. Each block tag and each list item starts
# a new paragraph.
#
# Checks per file:
#   chars    no em dash and no semicolon in prose
#   length   no sentence over 25 words
#   abbrev   no "e.g.", "i.e.", or "vs" in prose (quoted mentions are allowed)
#   code     the file without its TSDoc comments is byte for byte identical to the base version
#   blocks   fenced code blocks inside comments and {@includeCode} tags are identical to the base version
#   tags     the same block tags, modifier tags, @param names, @defaultValue values, and {@link} targets as the base version
#   numbers  the same set of numeric tokens in comment text as the base version
#   shorter  prose word count did not grow
#
# A file with no base version gets the first three checks only.
# Exit status is 1 when any check fails.
set -u
base=$1
shift
fail=0

# perl program: reads one file, prints one line per comment paragraph.
# MODE=prose replaces code spans with X. MODE=nums keeps them for the numbers check.
read -r -d '' EXTRACT <<'PERL'
local $/;
my $src = <>;
my $mode = $ENV{MODE} // 'prose';
while ($src =~ m{/\*\*(.*?)\*/}gs) {
	my $c = $1;
	my @lines = map { s/^\s*\*\s?//; $_ } split /\n/, $c;
	my $t = join("\n", @lines);
	$t =~ s/```.*?```/\n\n/gs;
	$t =~ s/^\s*\|[^\n]*$//mg;
	$t =~ s/\{\@includeCode[^}]*\}/ X /g;
	$t =~ s/\{\@link\s+[^}|]*\|\s*([^}]*)\}/$1/g;
	$t =~ s/\{\@link\s+[^}]*\}/ X /g;
	$t =~ s/\{\@[a-zA-Z]+[^}]*\}/ X /g;
	$t =~ s/`[^`]*`/ X /g if $mode eq 'prose';
	$t =~ s/https?:\/\/\S+/ X /g;
	$t =~ s/\@(?:param|typeParam)\s+\S+\s*-?\s*/\n\n/g;
	$t =~ s/\@(?:returns?|remarks|example|see|defaultValue|deprecated|throws|since|group|category|privateRemarks|description|summary|enum)\b\s*-?\s*/\n\n/g;
	$t =~ s/\@(?:public|beta|alpha|internal|readonly|sealed|virtual|override|eventProperty|packageDocumentation|experimental|hidden|ignore)\b//g;
	$t =~ s/^\s*(?:[-*]|\d+\.)\s+/\n\n/mg;
	$t =~ s/^#+\s+//mg;
	$t =~ s/^[ \t]+//mg;
	$t =~ s/\n{3,}/\n\n/g;
	$t =~ s/^\s+|\s+$//g;
	next unless length $t;
	for my $p (split /\n\s*\n/, $t) {
		$p =~ s/\s+/ /g;
		print "$p\n";
	}
}
PERL

prose() { MODE=prose perl -e "$EXTRACT" "$1"; }
nums() { MODE=nums perl -e "$EXTRACT" "$1" | perl -ne 'print "$_\n" for /\d[\d,.]*\d|\d/g' | sort -u; }
code() { perl -0777 -pe 's{/\*\*.*?\*/}{}gs' "$1"; }
blocks() {
	perl -0777 -ne '
		while (m{/\*\*(.*?)\*/}gs) {
			my $c = $1;
			print "$_\n" for $c =~ /(```.*?```)/gs;
			print "$_\n" for $c =~ /(\{\@includeCode[^}]*\})/g;
		}' "$1"
}
tags() {
	perl -0777 -ne '
		while (m{/\*\*(.*?)\*/}gs) {
			my $c = $1;
			$c =~ s/```.*?```//gs;
			print "$_\n" for $c =~ /(\{\@link\s+[^}|\s]+)/g;
			print "$_\n" for $c =~ /(\@(?:param|typeParam)\s+\S+)/g;
			print "$_\n" for $c =~ /(\@defaultValue\s+[^\n]*?)\s*$/mg;
			print "$_\n" for $c =~ /(?<![\w{])(\@(?!param\b|typeParam\b|defaultValue\b)[a-zA-Z]+)/g;
		}' "$1" | sort
}
sentences_over_25() {
	prose "$1" | perl -ne '
		chomp;
		for my $s (split /(?<=[.!?:])\s+(?=[A-Z"(])/, $_) {
			my $n = () = $s =~ /\S+/g;
			print "[$n] $s\n" if $n > 25;
		}'
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

	out=$(prose "$f" | perl -ne 'print "$.: $_" if /\xE2\x80\x94|;/')
	report chars "$f" "$out"

	out=$(sentences_over_25 "$f")
	report length "$f" "$out"

	out=$(prose "$f" | perl -ne 'print "$.: $_" if /(?<!["\x27])\b(?:e\.g\.|i\.e\.|vs\.?)(?=\W|$)/')
	report abbrev "$f" "$out"

	if [ "$hasbase" = 1 ]; then
		out=$(cmp -s <(code "$before") <(code "$f") || echo "code outside TSDoc comments changed")
		report code "$f" "$out"

		out=$(diff <(blocks "$before") <(blocks "$f") || true)
		report blocks "$f" "$out"

		out=$(diff <(tags "$before") <(tags "$f") || true)
		report tags "$f" "$out"

		out=$(diff <(nums "$before") <(nums "$f") || true)
		report numbers "$f" "$out"

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
