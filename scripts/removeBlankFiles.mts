import { Glob } from 'glob';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

export async function removeBlankFiles(folder: string = 'dist'): Promise<void> {
	const files = new Glob(path.join(folder, '**/*.{js,cjs}'), {});

	const pending: Promise<void>[] = [];

	for await (const file of files) {
		const fileContent = await readFile(file, 'utf8');
		if (!fileContent.startsWith('export {};\n//# sourceMappingURL=')) {
			continue;
		}

		pending.push(unlink(file));
		pending.push(unlink(file + '.map'));
	}

	await Promise.all(pending);
}
