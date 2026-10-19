import { defineConfig, type UserConfig } from 'tsdown'

const config: UserConfig = defineConfig({
	// Keep the output names dist/index.js and dist/index.d.ts.
	fixedExtension: false,
})

export default config
