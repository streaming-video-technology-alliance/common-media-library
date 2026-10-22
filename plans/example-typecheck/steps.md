# Example typecheck: implementation steps

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every fenced TypeScript block in the root README, the package READMEs, and the package guides typechecks on its own, and a root script test proves this on every PR.

**Architecture:** `scripts/checkExamples.ts` extracts the blocks and typechecks them in one TypeScript program through the compiler API. Each block is a virtual ES module under the repo root, so `@svta/cml-*` resolves to the built `dist/` folders. `scripts/checkExamples.test.ts` holds unit tests and the gate. The 51 failing blocks get `import` and `declare` lines, and seven blocks get corrected code.

**Tech Stack:** Node 24 (runs `.ts` directly), `node:test`, TypeScript 5.8.2 compiler API (root devDependency).

Design: [design.md](design.md). Per-block fixes: [inventory.md](inventory.md).

## Global constraints

- Branch: `issue/565-example-typecheck`, created from `claude/issue-565-planning-e547e2` so the plan files travel with the work. Delete `plans/example-typecheck/` before the PR merges.
- One PR to `main`. Commit with `git commit -s`. Conventional Commits. Add the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Compiler settings: the root `tsconfig.json`, strict. Blocks never share declarations.
- Values from the reader's code are declared with `declare const` or `declare function`. No skip marker. No hidden preamble.
- Intentional compile errors are marked with `// @ts-expect-error` on the line above.
- Keep each guide's quote and semicolon style.
- Prose, changelog entries, and the PR body follow the AGENTS.md Writing Style. Run the gate in [[global-audience-prose]] before every prose commit.
- Build before the check: `npm run build` at the root. The gate reports TS2307 when a `dist/` is missing.
- After any guide change, run the root `npm run build` and commit `skills/common-media-library/references/*.md`. CI fails when the skill files are stale.
- Never leave a scratch `.ts` file in the tree. Lint and typecheck include every `.ts` file.

---

### Task 1: Block extraction and file listing

**Files:**
- Create: `scripts/checkExamples.ts`
- Create: `scripts/checkExamples.test.ts`

**Interfaces:**
- Produces: `type ExampleBlock = { file: string; line: number; code: string }`, `extractExampleBlocks(markdown: string, file: string): ExampleBlock[]`, `listExampleFiles(repoRoot: string): string[]`. `file` is repo-relative with forward slashes. `line` is the 1-based line of the opening fence.

- [ ] **Step 1: Create the branch**

```bash
git switch -c issue/565-example-typecheck claude/issue-565-planning-e547e2
```

- [ ] **Step 2: Write the failing tests**

Create `scripts/checkExamples.test.ts`:

```ts
import { deepEqual, ok } from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { extractExampleBlocks, listExampleFiles } from './checkExamples.ts'

const repoRoot = path.resolve(import.meta.dirname, '..')

describe('extractExampleBlocks', () => {
	it('returns the ts and typescript fences with the line of the opening fence', () => {
		const markdown = '# Title\n\n```typescript\nconst a = 1\n```\n\ntext\n\n```ts\nconst b = 2\n```\n'
		deepEqual(extractExampleBlocks(markdown, 'libs/x/README.md'), [
			{ file: 'libs/x/README.md', line: 3, code: 'const a = 1\n' },
			{ file: 'libs/x/README.md', line: 9, code: 'const b = 2\n' },
		])
	})

	it('ignores fences of other languages and fences nested in them', () => {
		const markdown = '```bash\nnpm install\n```\n\n````markdown\n```typescript\nnot code\n```\n````\n'
		deepEqual(extractExampleBlocks(markdown, 'f.md'), [])
	})

	it('keeps blank lines inside a block', () => {
		const markdown = '```typescript\nconst a = 1\n\nconst b = 2\n```\n'
		deepEqual(extractExampleBlocks(markdown, 'f.md'), [{ file: 'f.md', line: 1, code: 'const a = 1\n\nconst b = 2\n' }])
	})
})

describe('listExampleFiles', () => {
	it('lists the root README, the package READMEs, and the guides', () => {
		const files = listExampleFiles(repoRoot)
		ok(files.includes('README.md'))
		ok(files.includes('libs/cmcd/README.md'))
		ok(files.includes('libs/cmcd/docs/user-guide.md'))
		ok(!files.some(file => file.includes('node_modules') || file.includes('/dist/')))
	})
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `node --no-warnings --test scripts/checkExamples.test.ts`
Expected: FAIL with `Cannot find module './checkExamples.ts'`.

- [ ] **Step 4: Write the extraction**

Create `scripts/checkExamples.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/** One fenced TypeScript block of a markdown file. */
export type ExampleBlock = {
	/** Repo-relative path of the markdown file, with forward slashes. */
	file: string;
	/** 1-based line of the opening fence. */
	line: number;
	/** The code between the fences, with a trailing newline. */
	code: string;
};

const openFence = /^(`{3,})(\S*)/
const exampleLanguages = new Set(['ts', 'typescript'])

/** Returns the `ts` and `typescript` fenced blocks of `markdown`. Fences must start at column 0. */
export function extractExampleBlocks(markdown: string, file: string): ExampleBlock[] {
	const blocks: ExampleBlock[] = []
	const lines = markdown.split('\n')
	let fence = ''
	let language = ''
	let start = 0
	let code: string[] = []

	for (let i = 0; i < lines.length; i++) {
		const text = lines[i]

		if (fence === '') {
			const match = openFence.exec(text)
			if (match) {
				fence = match[1]
				language = match[2]
				start = i
				code = []
			}
			continue
		}

		if (text.trimEnd() === fence) {
			if (exampleLanguages.has(language)) {
				blocks.push({ file, line: start + 1, code: `${code.join('\n')}\n` })
			}
			fence = ''
			continue
		}

		code.push(text)
	}

	return blocks
}

/** Returns the repo-relative paths of the root README, every package README, and every package guide. */
export function listExampleFiles(repoRoot: string): string[] {
	const files = ['README.md']
	const libs = path.join(repoRoot, 'libs')

	for (const folder of readdirSync(libs).sort()) {
		const readme = path.posix.join('libs', folder, 'README.md')
		if (existsSync(path.join(repoRoot, readme))) {
			files.push(readme)
		}

		const docs = path.posix.join('libs', folder, 'docs')
		if (existsSync(path.join(repoRoot, docs))) {
			for (const name of readdirSync(path.join(repoRoot, docs)).sort()) {
				if (name.endsWith('.md')) {
					files.push(path.posix.join(docs, name))
				}
			}
		}
	}

	return files
}

/** Reads every example block of the files that `listExampleFiles` returns. */
export function readExampleBlocks(repoRoot: string): ExampleBlock[] {
	return listExampleFiles(repoRoot).flatMap(file => extractExampleBlocks(readFileSync(path.join(repoRoot, file), 'utf8'), file))
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --no-warnings --test scripts/checkExamples.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: no errors. Fix any eslint finding in the two new files (single quotes, no semicolons, tabs).

- [ ] **Step 7: Commit**

```bash
git add scripts/checkExamples.ts scripts/checkExamples.test.ts
git commit -s -m "feat(scripts): extract the example blocks of the READMEs and guides" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: In-process typecheck of the blocks

**Files:**
- Modify: `scripts/checkExamples.ts`
- Modify: `scripts/checkExamples.test.ts`

**Interfaces:**
- Consumes: `ExampleBlock`, `readExampleBlocks(repoRoot)` from Task 1.
- Produces: `type ExampleDiagnostic = { file: string; line: number; code: number; message: string }`, `checkExamples(blocks: ExampleBlock[], repoRoot: string): ExampleDiagnostic[]`, `formatDiagnostic(diagnostic: ExampleDiagnostic): string`. `line` is the markdown line of the error.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/checkExamples.test.ts`. Extend the import line to `import { checkExamples, extractExampleBlocks, formatDiagnostic, listExampleFiles, type ExampleBlock } from './checkExamples.ts'` and add `equal` to the assert import.

```ts
describe('checkExamples', () => {
	it('reports a type error at the markdown line', () => {
		const block: ExampleBlock = { file: 'libs/x/docs/guide.md', line: 10, code: 'const n: number = 1\nconst s: number = "a"\nconsole.log(n, s)\n' }
		const diagnostics = checkExamples([block], repoRoot)
		equal(diagnostics.length, 1)
		equal(diagnostics[0].code, 2322)
		equal(diagnostics[0].file, 'libs/x/docs/guide.md')
		equal(diagnostics[0].line, 12)
		equal(formatDiagnostic(diagnostics[0]), 'libs/x/docs/guide.md:12 TS2322: Type \'string\' is not assignable to type \'number\'.')
	})

	it('resolves package imports to the built packages', () => {
		const block: ExampleBlock = { file: 'libs/x/README.md', line: 1, code: 'import { appendCmcdQuery } from "@svta/cml-cmcd";\nconsole.log(appendCmcdQuery("https://cdn.example.com/a.m4s", { br: [1000] }));\n' }
		deepEqual(checkExamples([block], repoRoot), [])
	})

	it('accepts top-level await and the same declare in two blocks', () => {
		const code = 'declare const url: string\nconst response = await fetch(url)\nconsole.log(response.status)\n'
		const blocks: ExampleBlock[] = [{ file: 'a.md', line: 1, code }, { file: 'b.md', line: 1, code }]
		deepEqual(checkExamples(blocks, repoRoot), [])
	})

	it('fails when an expected error does not occur', () => {
		const block: ExampleBlock = { file: 'f.md', line: 1, code: '// @ts-expect-error\nconst n: number = 1\nconsole.log(n)\n' }
		equal(checkExamples([block], repoRoot)[0]?.code, 2578)
	})
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --no-warnings --test scripts/checkExamples.test.ts`
Expected: FAIL with `checkExamples is not a function` or an import error for `checkExamples`.

- [ ] **Step 3: Write the typecheck**

Add to `scripts/checkExamples.ts`. Add `import ts from 'typescript'` to the imports.

```ts
/** One compiler error, located in the markdown file. */
export type ExampleDiagnostic = {
	file: string;
	/** 1-based markdown line. 0 when the error has no location. */
	line: number;
	/** The numeric TypeScript code, such as 2304. */
	code: number;
	message: string;
};

/** The folder, under the repo root, that holds the virtual block modules. It does not exist on disk. */
const virtualFolder = '.example-check'

/** The root tsconfig options, adjusted for a noEmit check of standalone blocks. */
export function exampleCompilerOptions(repoRoot: string): ts.CompilerOptions {
	const configPath = path.join(repoRoot, 'tsconfig.json')
	const config = ts.readConfigFile(configPath, ts.sys.readFile)

	if (config.error) {
		throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
	}

	const { options, errors } = ts.convertCompilerOptionsFromJson(config.config.compilerOptions, repoRoot)

	if (errors.length > 0) {
		throw new Error(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'))
	}

	const { incremental, declaration, declarationMap, isolatedDeclarations, sourceMap, inlineSources, outDir, tsBuildInfoFile, ...rest } = options

	return {
		...rest,
		noEmit: true,
		skipLibCheck: true,
		noUnusedLocals: false,
		noUnusedParameters: false,
		moduleDetection: ts.ModuleDetectionKind.Force,
	}
}

/** Typechecks every block as its own ES module. Package imports resolve to the built `dist/` folders. */
export function checkExamples(blocks: ExampleBlock[], repoRoot: string): ExampleDiagnostic[] {
	const options = exampleCompilerOptions(repoRoot)
	const base = path.join(repoRoot, virtualFolder)
	const virtual = new Map<string, string>()
	const origin = new Map<string, ExampleBlock>()

	virtual.set(path.join(base, 'package.json'), '{"type":"module"}')

	blocks.forEach((block, index) => {
		const name = path.join(base, `${block.file}.${index}.ts`)
		virtual.set(name, block.code)
		origin.set(name, block)
	})

	const host = ts.createCompilerHost(options)
	const { fileExists, readFile, getSourceFile } = host

	host.fileExists = file => virtual.has(file) || fileExists.call(host, file)
	host.readFile = file => virtual.get(file) ?? readFile.call(host, file)
	host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => {
		const code = virtual.get(file)
		return code === undefined
			? getSourceFile.call(host, file, languageVersion, onError, shouldCreateNewSourceFile)
			: ts.createSourceFile(file, code, languageVersion, true)
	}

	const program = ts.createProgram([...origin.keys()], options, host)

	return ts.getPreEmitDiagnostics(program).map(diagnostic => locate(diagnostic, origin))
}

function locate(diagnostic: ts.Diagnostic, origin: Map<string, ExampleBlock>): ExampleDiagnostic {
	const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
	const block = diagnostic.file ? origin.get(diagnostic.file.fileName) : undefined

	if (!diagnostic.file || !block || diagnostic.start === undefined) {
		return { file: diagnostic.file?.fileName ?? '', line: 0, code: diagnostic.code, message }
	}

	const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)

	return { file: block.file, line: block.line + 1 + line, code: diagnostic.code, message }
}

/** `file:line TScode: message`, one line. */
export function formatDiagnostic(diagnostic: ExampleDiagnostic): string {
	return `${diagnostic.file}:${diagnostic.line} TS${diagnostic.code}: ${diagnostic.message}`
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run build && node --no-warnings --test scripts/checkExamples.test.ts`
Expected: PASS, 8 tests. If the package import test fails with TS2307, the build did not run.

- [ ] **Step 5: Lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: no errors. The unused names in the destructuring are allowed by `ignoreRestSiblings`.

- [ ] **Step 6: Commit**

```bash
git add scripts/checkExamples.ts scripts/checkExamples.test.ts
git commit -s -m "feat(scripts): typecheck the example blocks with the compiler API" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: The gate test

**Files:**
- Modify: `scripts/checkExamples.test.ts`

**Interfaces:**
- Consumes: `readExampleBlocks(repoRoot)`, `checkExamples`, `formatDiagnostic` from Tasks 1 and 2.

- [ ] **Step 1: Write the gate**

Append to `scripts/checkExamples.test.ts`. Add `readExampleBlocks` to the import.

```ts
describe('example blocks', () => {
	it('every block in the READMEs and guides typechecks on its own', () => {
		const diagnostics = checkExamples(readExampleBlocks(repoRoot), repoRoot)
		const report = [
			`${diagnostics.length} example block errors. Run \`npm run build\` first when the errors are TS2307.`,
			...diagnostics.map(formatDiagnostic),
		].join('\n')
		equal(diagnostics.length, 0, report)
	})
})
```

- [ ] **Step 2: Run the gate to verify it fails with the known blocks**

Run: `node --no-warnings --test scripts/checkExamples.test.ts 2>&1 | grep -c ' TS[0-9]*: '`
Expected: 123. The errors are in 51 blocks of 9 guides. One of the lines reads `libs/c2pa/docs/manifest-box-validation.md:29 TS2552: Cannot find name 'segmentUrls'. Did you mean 'segmentUrl'?`.

- [ ] **Step 3: Commit**

```bash
git add scripts/checkExamples.test.ts
git commit -s -m "test(scripts): gate every example block on a clean typecheck" -m "The gate fails until the guides are fixed in the next commits." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: iso-bmff guides

**Files:**
- Modify: `libs/iso-bmff/docs/utilities.md:12-28`
- Modify: `libs/iso-bmff/docs/writing-boxes.md:22-118`
- Modify: `libs/iso-bmff/CHANGELOG.md:9-14`

**Interfaces:**
- Consumes: the gate from Task 3.

- [ ] **Step 1: Fix the utilities guide**

Replace the block at line 12 with:

```typescript
import { readIsoBoxes, traverseIsoBoxes } from "@svta/cml-iso-bmff";

declare const bytes: Uint8Array;

const boxes = readIsoBoxes(bytes);

for (const box of traverseIsoBoxes(boxes)) {
	console.log(box.type);
}
```

Replace the block at line 24 with:

```typescript
import { isContainer, type IsoBox } from "@svta/cml-iso-bmff";

const box: IsoBox = { type: "meta", version: 0, flags: 0, boxes: [] };
const container = isContainer(box);
```

- [ ] **Step 2: Fix the writing guide**

In the blocks at lines 22 and 53: add `type IsoBoxStreamable` to the import, add `declare const sourceBuffer: SourceBuffer;` after the import, change `const boxes = [` to `const boxes: IsoBoxStreamable[] = [`, and change `sourceBuffer.appendBuffer(byteArray.buffer);` to `sourceBuffer.appendBuffer(byteArray);`.

Replace the block at line 93 with:

```typescript
import {
	createIsoBoxReadableStream,
	defaultWriterConfig,
	type IsoBoxStreamable,
} from "@svta/cml-iso-bmff";

declare const transport: WebTransport;

const boxes: IsoBoxStreamable[] = [
	{
		type: "ftyp",
		majorBrand: "isom",
		minorVersion: 1,
		compatibleBrands: ["isom"],
	},
	{
		type: "mdat",
		data: new Uint8Array([
			102, 105, 114, 115, 116, 115, 101, 99, 111, 110, 100, 116, 104, 105, 114,
			100,
		]),
	},
];

const readableStream = createIsoBoxReadableStream(boxes, defaultWriterConfig());

const stream = await transport.createBidirectionalStream();
readableStream.pipeTo(stream.writable);
```

Read the prose between lines 89 and 121. Replace any `webTransport` with `transport`.

- [ ] **Step 3: Run the gate**

Run: `node --no-warnings --test scripts/checkExamples.test.ts 2>&1 | grep -E 'libs/iso-bmff/docs/.*TS[0-9]+:'`
Expected: no lines.

- [ ] **Step 4: Add the changelog entry**

Under `## [Unreleased]` / `### Changed` in `libs/iso-bmff/CHANGELOG.md`, add:

```markdown
- Every code example in the guides now typechecks on its own. The writing examples pass each `Uint8Array` to `appendBuffer` directly, and the `traverseIsoBoxes` example reads the boxes first ([#565](https://github.com/streaming-video-technology-alliance/common-media-library/issues/565)).
```

- [ ] **Step 5: Regenerate the skill files and commit**

```bash
npm run build
git add libs/iso-bmff/docs libs/iso-bmff/CHANGELOG.md skills
git commit -s -m "docs(iso-bmff): make every guide example typecheck on its own" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: c2pa guides

**Files:**
- Modify: `libs/c2pa/docs/manifest-box-validation.md:23-166`
- Modify: `libs/c2pa/docs/merkle-validation.md:23-69`
- Modify: `libs/c2pa/docs/results-and-error-codes.md:14-205`
- Modify: `libs/c2pa/docs/vsi-validation.md:21-258`
- Modify: `libs/c2pa/CHANGELOG.md:9-16`

**Interfaces:**
- Consumes: the gate from Task 3. The exported types `InitSegmentValidation`, `SegmentValidationResult`, `MerkleSegmentState`, `ManifestBoxValidationState` from `@svta/cml-c2pa`.

- [ ] **Step 1: Apply the twelve fixes of inventory.md**

Follow the four c2pa tables in [inventory.md](inventory.md). The declaration lines, in the style of the file:

```typescript
declare const initUrl: string
declare const segmentUrls: string[]
declare const init: InitSegmentValidation
declare const result: SegmentValidationResult
```

The block at `manifest-box-validation.md:154` becomes:

```typescript
import { validateC2paManifestBoxSegment, type ManifestBoxValidationState } from '@svta/cml-c2pa'

declare const bytes: Uint8Array
declare const lastManifestId: string | null
declare const state: ManifestBoxValidationState | undefined
declare function verifyAnchorChain(anchorToken: unknown, instanceId: string | null): boolean

const { result } = await validateC2paManifestBoxSegment(bytes, lastManifestId, state, {
  continuityValidator: {
    method: 'com.example.anchor-chain',
    validate: (liveVideoAssertion, manifest) => {
      // method-specific fields are available on liveVideoAssertion
      return verifyAnchorChain(liveVideoAssertion['anchorToken'], manifest.instanceId)
    },
  },
})
```

- [ ] **Step 2: Run the gate**

Run: `node --no-warnings --test scripts/checkExamples.test.ts 2>&1 | grep -E 'libs/c2pa/docs/.*TS[0-9]+:'`
Expected: no lines.

- [ ] **Step 3: Add the changelog entry**

`libs/c2pa/CHANGELOG.md` has a `### Fixed` section under `## [Unreleased]`. Add a `### Changed` section after it:

```markdown
### Changed

- Every code example in the guides now typechecks on its own. Values that the player provides are declared with `declare const` ([#565](https://github.com/streaming-video-technology-alliance/common-media-library/issues/565)).
```

- [ ] **Step 4: Regenerate the skill files and commit**

```bash
npm run build
git add libs/c2pa/docs libs/c2pa/CHANGELOG.md skills
git commit -s -m "docs(c2pa): make every guide example typecheck on its own" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: cmcd guides

**Files:**
- Modify: `libs/cmcd/docs/user-guide.md:83-920`
- Modify: `libs/cmcd/docs/validation-guide.md:23-33`
- Modify: `libs/cmcd/docs/report-recorder-guide.md:61-300`
- Modify: `libs/cmcd/CHANGELOG.md:9-14`

**Interfaces:**
- Consumes: the gate from Task 3. `CmcdReporter`, `CmcdReportRecorder`, `CmcdEventType`, `toCmcdValue`, `CMCD_REQUEST_PROVENANCE`, `CmcdRecordedRequestType`, and the types `CmcdObjectType`, `Cmcd`, `CmcdEventReportTransform`, `CmcdValidationSeverity`, `CmcdRecordedReport`, `CmcdRecordedReportMode`, `CmcdTransportAdapter`, `CmcdRequestDeliver` from `@svta/cml-cmcd`. `HttpRequest` from `@svta/cml-utils`.

- [ ] **Step 1: Apply the 34 fixes of inventory.md**

Follow the three cmcd tables in [inventory.md](inventory.md). The two blocks with corrected code:

`user-guide.md:479`:

```typescript
import { CmcdReporter } from "@svta/cml-cmcd";

declare const reporter: CmcdReporter;

const decoratedRequest = reporter.createRequestReport({
	url: "https://cdn.example.com/segment.mp4",
});

// After receiving a response
const response = {
	status: 200,
	request: decoratedRequest,
	resourceTiming: {
		startTime: performance.now(),
		responseStart: performance.now() + 50,
		duration: 150,
		encodedBodySize: 512000,
	},
};

reporter.recordResponseReceived(response);
```

`user-guide.md:498`:

```typescript
import { CmcdReporter } from "@svta/cml-cmcd";
import type { CmcdObjectType } from "@svta/cml-cmcd";

declare const reporter: CmcdReporter;
declare const player: {
	getBufferLength(): number;
	getMeasuredThroughput(): number;
};

type SegmentInfo = {
	bitrate: number;
	duration: number;
	type: CmcdObjectType;
};

async function fetchSegment(
	url: string,
	segmentInfo: SegmentInfo,
): Promise<ArrayBuffer> {
	// Update player state
	reporter.update({
		bl: [player.getBufferLength()],
		mtp: [player.getMeasuredThroughput()],
	});

	// Decorate the request with CMCD data
	const request = reporter.createRequestReport(
		{ url, method: "GET" },
		{
			br: [segmentInfo.bitrate],
			d: segmentInfo.duration,
			ot: segmentInfo.type,
		},
	);

	// Fetch the segment and capture timing
	const startTime = performance.now();
	const response = await fetch(request.url, request);
	const responseStart = performance.now();
	const buffer = await response.arrayBuffer();
	const duration = performance.now() - startTime;

	// Record the response received event
	reporter.recordResponseReceived({
		status: response.status,
		request,
		resourceTiming: {
			startTime,
			responseStart,
			duration,
			encodedBodySize: buffer.byteLength,
		},
	});

	return buffer;
}
```

The two blocks with an intentional error, `user-guide.md:899` and `user-guide.md:909`:

```typescript
import { CmcdReporter } from "@svta/cml-cmcd";

type PlayerData = { requestType: "segment" | "manifest" | "license" };

declare const reporter: CmcdReporter<PlayerData>;

// Error: 'requestTypo' does not exist in type 'PlayerData'
reporter.createRequestReport({
	url: "https://cdn.example.com/segment.mp4",
	// @ts-expect-error
	customData: { requestTypo: "segment" },
});
```

```typescript
import type { CmcdEventReportTransform } from "@svta/cml-cmcd";

type PlayerData = { timing: { start: number } };

const transform: CmcdEventReportTransform<PlayerData> = (data, request) => {
	const customData = request?.customData;

	// Error: cannot assign to 'start' because it is a read-only property
	// @ts-expect-error
	if (customData) customData.timing.start = 0;

	return data;
};
```

- [ ] **Step 2: Run the gate**

Run: `node --no-warnings --test scripts/checkExamples.test.ts`
Expected: PASS, 9 tests. No `libs/` lines in the output.

- [ ] **Step 3: Check the prose that names a changed identifier**

Read `libs/cmcd/docs/user-guide.md` lines 467 to 495. If the table of `resourceTiming` fields claims to be complete, add a row for `encodedBodySize`. Otherwise leave the prose.

- [ ] **Step 4: Add the changelog entry**

Under `## [Unreleased]` / `### Changed` in `libs/cmcd/CHANGELOG.md`, add:

```markdown
- Every code example in the guides now typechecks on its own. The `recordResponseReceived` examples now include `encodedBodySize` ([#565](https://github.com/streaming-video-technology-alliance/common-media-library/issues/565)).
```

- [ ] **Step 5: Regenerate the skill files and commit**

```bash
npm run build
git add libs/cmcd/docs libs/cmcd/CHANGELOG.md skills
git commit -s -m "docs(cmcd): make every guide example typecheck on its own" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: The documentation rule and the PR

**Files:**
- Modify: `AGENTS.md:55` and `AGENTS.md:72`
- Delete before the merge: `plans/example-typecheck/`

- [ ] **Step 1: Update AGENTS.md**

Replace line 72 (`- All code examples must be complete and runnable: no pseudocode and no missing imports.`) with three bullets:

```markdown
- Every fenced TypeScript block in a README or guide must typecheck on its own. Import every library name the block uses. Declare values that the reader's code provides with `declare const` or `declare function`. No pseudocode.
- A block that shows a compile error marks the line with `// @ts-expect-error`.
- TSDoc examples that `{@includeCode}` a test region compile with the test file. The standalone rule does not apply to them.
```

After line 55 (`- Typecheck the entire project after code changes`) add:

```markdown
- The root `npm test` typechecks every example block of the READMEs and guides. Run it after a README or guide change.
```

- [ ] **Step 2: Run the full validation**

Run: `npm test`
Expected: lint, build, typecheck, every script test, and every package test pass. The run takes several minutes. Run it in the background.

- [ ] **Step 3: Run the writing-style gate on the prose**

Check the new AGENTS.md bullets, the three changelog entries, and the commit messages against the AGENTS.md Writing Style: sentences under 20 words, no semicolons, no pronouns without a noun, active voice.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -s -m "docs: require every example block to typecheck on its own" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 5: Confirm the skill files are current**

Run: `npm run build && git status --short skills`
Expected: no output from `git status`.

- [ ] **Step 6: Open the PR**

Casey runs `/create-pr main` or the app action. The PR body states: the check and where it runs, the count of fixed blocks per package (iso-bmff 5, c2pa 12, cmcd 34), the seven blocks with corrected code, the `declare const` rule, and `Closes #565`. The body follows the Writing Style.

- [ ] **Step 7: Remove the plan files before the merge**

```bash
git rm -r plans/example-typecheck
git commit -s -m "chore: remove the example typecheck plan files" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Open a GitHub issue for any follow-up item that came up during the work. Do not record follow-ups in the plan files.
