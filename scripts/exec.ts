import { exec as ex } from 'node:child_process';

export async function exec(cmd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		ex(cmd, (error, stdout) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(stdout);
		});
	});
}
