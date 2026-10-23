import { rm } from 'node:fs/promises'
import { cmd } from './cmd.ts'

await rm('dist', { recursive: true, force: true })
await cmd('vp pack --logLevel error')
await cmd('api-extractor run --local')
