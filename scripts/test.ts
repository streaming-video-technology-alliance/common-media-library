import { cmd } from './cmd.ts'

await cmd('node --no-warnings --test **/*.test.ts **/**/*.test.ts **/**/*.test.ts')
