import { spawn, SpawnOptionsWithoutStdio } from 'node:child_process';

export function cmd(cmd: string, args?: string[], options?: SpawnOptionsWithoutStdio): Promise<void> {
	const opts = Object.assign({
		cwd: process.cwd(),
		env: process.env,
		stdio: 'inherit',
		shell: true,
	}, options);

	return new Promise<void>((resolve, reject) => {
		const proc = spawn(cmd, args, opts);
		proc.on('error', reject);
		proc.on('close', (code) => {
			if (code === 0) {
				resolve();
			}
			else {
				reject(new Error(`Exit with error code: ${code}`));
			}
		});
	});
}
