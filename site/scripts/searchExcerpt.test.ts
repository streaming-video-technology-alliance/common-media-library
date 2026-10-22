import { equal } from 'node:assert/strict'
import { describe, it } from 'node:test'
import { searchExcerpt } from './searchExcerpt.ts'

const page = `# Function: encodeCmcd()

\`\`\`ts
function encodeCmcd(cmcd, options?): string;
\`\`\`

Defined in: [encodeCmcd.ts:21](https://example.com)

Encode a CMCD object to a string.

## Parameters

### cmcd

The CMCD object to encode.
`

describe('searchExcerpt', () => {
	it('keeps the title and the first paragraph of prose', () => {
		equal(searchExcerpt(page), '# Function: encodeCmcd()\n\nEncode a CMCD object to a string.\n')
	})

	it('keeps only the title when there is no prose', () => {
		equal(searchExcerpt('# Type Alias: Cmcd\n\n```ts\ntype Cmcd = object;\n```\n'), '# Type Alias: Cmcd\n')
	})

	it('returns the input when there is no title', () => {
		equal(searchExcerpt('Just text\n'), 'Just text\n')
	})
})
