import { Glob } from 'glob';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

export async function removeBlankFiles(folder: string = 'dist'): Promise<any> {
	const files = new Glob(path.join(folder, '**/*.{js,cjs}'), {});

	const pending: Promise<any>[] = [];
	const checkFile = async (file: string) => {
		const fileContent = await readFile(file, 'utf8');
		if (!fileContent.startsWith('export {};\n//# sourceMappingURL=')) {
			return;
		}

		return Promise.all([
			unlink(file),
			unlink(file + '.map'),
		]);
	};

	for await (const file of files) {
		pending.push(checkFile(file));
	}

	return Promise.all(pending);
}
