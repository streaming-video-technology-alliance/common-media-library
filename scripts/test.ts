import path from 'node:path'
import { cmd } from './cmd.ts'

// Runs the tests of the package in the current directory. Vitest resolves the
// root configuration and the test files from the repository root.
const root = path.resolve(import.meta.dirname, '..')
const target = path.relative(root, process.cwd())

await cmd(`vp test --run ${target}`, undefined, { cwd: root })
