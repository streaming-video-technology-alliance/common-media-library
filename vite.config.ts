import { defineConfig } from 'vite';

const { PORT } = process.env;

export default defineConfig({
	server: {
		host: true,
		port: PORT ? parseInt(PORT) : 8080,
		open: '/dev/',
	},
});
