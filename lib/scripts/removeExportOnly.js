import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

const exportOnly = 'export {};\n//# sourceMappingURL=';

async function processDir(dir) {
	const files = await readdir(dir, { withFileTypes: true });
	const pending = files.map(async entry => {
		const uri = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			return processDir(uri);
		}

		return readFile(uri, 'utf8')
			.then(fileContent => {
				if (fileContent.startsWith(exportOnly)) {
					return Promise.all([
						unlink(uri),
						unlink(uri + '.map'),
					]);
				}
			});
	});

	await Promise.all(pending);
}

processDir('dist');
