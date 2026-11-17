// Builds findings.md and the details-*.md files from audit.json, results.json, and findings-head.md.
// Usage, from the repository root: node plans/iso-bmff-v2-audit/report.ts
import { readFileSync, writeFileSync } from 'node:fs'

type Check = { verdict?: string; correction?: string; priorDecision?: string; worth?: string }

type Finding = {
	id: string
	title: string
	category: string
	severity: 'high' | 'medium' | 'low'
	breaking: boolean
	breakingReason?: string
	files?: string[]
	evidence: string
	proposal: string
	fact?: Check
	value?: Check
}

type Audit = { confirmed: Finding[]; rejected: Finding[] }

const dir = import.meta.dirname
const audit = JSON.parse(readFileSync(`${dir}/audit.json`, 'utf8')) as Audit
const results = JSON.parse(readFileSync(`${dir}/results.json`, 'utf8')) as Record<string, string>

const RFC =
	'G462 F240 G480 G482 F273 G469 G483 G493 G495 G500 G485 G491 G494 G463 G470 G509 G492 G487 G489 G496 G497 G499 G502 G486 G490 G481 G476 G498 G501 G484 G471 F433'.split(
		' ',
	)
const OTHER = 'G466 G467 G465 G464 G472 G478 G479 G477 G475 G474'.split(' ')
const SCOPE = 'F436 F438 F439 F440 F441 F442 F435 F434 F218'.split(' ')
const SETTLED = 'G446 G524 F27 G453 G460 F223'.split(' ')
const DUPLICATES: Record<string, string> = {
	G514: 'G473',
	G523: 'G473',
	G524: 'G446',
	G459: 'G452',
	G451: 'G455',
	G495: 'G463',
	G469: 'G491',
}

const GROUPS: [string, string, string][] = [
	[
		'rfc',
		'Corrections to the cursor RFC',
		'Each row names a defect or a gap in `rfc/iso-bmff-cursor-api.md`. Fix these rows before the RFC is accepted.',
	],
	[
		'breaking',
		'Breaking changes for 2.0.0',
		'Each row changes a public type, a name, or a result. The major version is the only release that can take these rows.',
	],
	['non-breaking', 'Changes that break nothing', 'Each row can ship in any release.'],
	[
		'settled',
		'Rows that conflict with a recorded decision',
		'Each row asks to reverse a decision that the maintainer recorded. Do nothing unless the maintainer reopens the decision.',
	],
	[
		'scope',
		'New functions and new box types',
		'Each row adds scope. None is an inconsistency of the current package.',
	],
	[
		'other',
		'Other packages and repository files',
		'Each row is outside `libs/iso-bmff`. Record each row as an issue for its own package.',
	],
]

const ORDER = { high: 0, medium: 1, low: 2 }
const WHEN: Record<string, string> = {
	'do-in-major': 'major',
	'do-anytime': 'any time',
	optional: 'optional',
}

function oneLine(text: string): string {
	return text.trim().replace(/\n+/g, ' ')
}

function group(finding: Finding): string {
	if (SETTLED.includes(finding.id)) return 'settled'
	if (RFC.includes(finding.id)) return 'rfc'
	if (OTHER.includes(finding.id)) return 'other'
	if (SCOPE.includes(finding.id)) return 'scope'
	return finding.breaking ? 'breaking' : 'non-breaking'
}

const merged = new Map<string, string[]>()
for (const [duplicate, primary] of Object.entries(DUPLICATES)) {
	merged.set(primary, [...(merged.get(primary) ?? []), duplicate])
}

const primaries = audit.confirmed.filter(finding => !(finding.id in DUPLICATES))
let tables = ''

for (const [key, title, intro] of GROUPS) {
	const rows = primaries
		.filter(finding => group(finding) === key)
		.sort(
			(a, b) =>
				ORDER[a.severity] - ORDER[b.severity] ||
				a.category.localeCompare(b.category) ||
				a.id.localeCompare(b.id),
		)

	tables += `\n## ${title}\n\n${intro} Details: \`details-${key}.md\`.\n\n| ID | Severity | Category | When | Finding | Result |\n| --- | --- | --- | --- | --- | --- |\n`
	let detail = `# ${title}: details\n\nThe audit agents wrote this text. The index is in \`findings.md\`.\n`

	for (const finding of rows) {
		const also = (merged.get(finding.id) ?? []).join(', ')
		const worth = finding.value?.worth ?? ''
		const correction = (finding.value?.correction || finding.fact?.correction || '').trim()
		const prior = (finding.value?.priorDecision || finding.fact?.priorDecision || '').trim()
		const files = (finding.files ?? []).map(file => `\`${file}\``).join(', ')

		const result = results[finding.id] ?? ''

		tables += `| ${finding.id}${also ? ` (${also})` : ''} | ${finding.severity} | ${finding.category} | ${WHEN[worth] ?? worth} | ${oneLine(finding.title).replace(/\|/g, '\\|')} | ${result} |\n`

		detail += `\n## ${finding.id}: ${oneLine(finding.title)}\n\n`
		detail += `Severity ${finding.severity}. Category ${finding.category}. Breaking: ${finding.breaking ? 'yes' : 'no'}. Fact check: ${finding.fact?.verdict}. Value check: ${finding.value?.verdict}.${also ? ` Merged duplicates: ${also}.` : ''}\n\n`
		if (finding.breaking && finding.breakingReason) {
			detail += `**Why it breaks.** ${finding.breakingReason.trim()}\n\n`
		}
		detail += `**Files.** ${files}\n\n`
		detail += `**Evidence.** ${finding.evidence.trim()}\n\n`
		detail += `**Proposal of the finder.** ${finding.proposal.trim()}\n\n`
		if (correction) detail += `**Proposal after verification.** ${correction}\n\n`
		if (prior) detail += `**Prior decision.** ${prior}\n`
		if (result) detail += `\n**Result.** ${result}.\n`
	}

	writeFileSync(`${dir}/details-${key}.md`, detail)
}

const rejected = audit.rejected
	.map(finding => `| ${finding.id} | ${oneLine(finding.title).replace(/\|/g, '\\|')} |`)
	.join('\n')
const head = readFileSync(`${dir}/findings-head.md`, 'utf8').trimEnd()

writeFileSync(
	`${dir}/findings.md`,
	`${head}\n${tables}\n## Rejected by verification\n\n| ID | Finding |\n| --- | --- |\n${rejected}\n`,
)
