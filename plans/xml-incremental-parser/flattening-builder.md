# Flattening builder example

This example belongs to the guide-level explanation of `rfc/xml-incremental-parser.md` and moved here
to keep the RFC short. It shows a builder that flattens a DASH manifest into a list of segment URLs, in
the way a HAM converter does (HAM is the Hypothetical Application Model, see `@svta/cml-cmaf-ham`).

A flattening builder cannot finish an `<S>` element inside `createElement`. A segment URL needs the
Representation id and bandwidth. In most manifests the `SegmentTemplate` is on the AdaptationSet, so its
`<S>` children arrive before the Representations that use them. The builder keeps a small record per
`<S>` and expands the records in `appendChild`, when the Representation or the Period ends:

```ts
import { parseXmlWith, type XmlBuilder } from '@svta/cml-xml'

type Timeline = { t: number; d: number; r: number }[]
type Level = { name: string; attributes: Record<string, string>; timeline: Timeline; segments: string[] }
type Model = { segments: string[] }

const flattening: XmlBuilder<Level, Model> = {
	createDocument: () => ({ segments: [] }),
	createElement: (parent, name, attributes, localName) => {
		const timeline = 'timeline' in parent && localName !== 'AdaptationSet' && localName !== 'Period' ? parent.timeline : []
		return { name: localName, attributes, timeline, segments: [] }
	},
	appendChild: (parent, child) => {
		if (child.name === 'S') {
			const parentTimeline = 'timeline' in parent ? parent.timeline : []
			parentTimeline.push({ t: Number(child.attributes['t'] ?? -1), d: Number(child.attributes['d']), r: Number(child.attributes['r'] ?? 0) })
		}
		else if (child.name === 'Representation') {
			for (const entry of child.timeline) {
				child.segments.push(`${child.attributes['id']}/${entry.t}.m4s`)
			}
			if ('timeline' in parent) {
				parent.segments.push(...child.segments)
			}
		}
		else if ('segments' in parent) {
			parent.segments.push(...child.segments)
		}
	},
}

export function listSegments(manifestText: string): string[] {
	return parseXmlWith(manifestText, flattening).segments
}
```

This is still one pass, but it depends on document order. The DASH schema puts `SegmentTemplate` before
`Representation` and `BaseURL` before `Period`, and this builder relies on that order. A tree consumer
does not have to.
