import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
	},
	resolve: {
		alias: {
			// 'obsidian' is not a real npm package; stub it for Vitest
			obsidian: new URL('./src/tests/__mocks__/obsidian.ts', import.meta.url).pathname,
			// monkey-around ships as ESM; point to the CJS build so Vitest/Node can load it
			'monkey-around': new URL('./node_modules/monkey-around/dist/index.cjs', import.meta.url).pathname,
		},
	},
});
