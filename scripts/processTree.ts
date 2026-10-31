import { spawn, type ChildProcess, type ChildProcessByStdio } from 'node:child_process'
import type { Readable } from 'node:stream'

type Options = {
	cwd?: string
	env?: NodeJS.ProcessEnv
}

const windows = process.platform === 'win32'

// Starts a process with piped output in its own process group, so that `killTree`
// can stop it together with the subprocesses that inherit the pipes.
export function spawnTree(
	command: string,
	args: string[],
	options: Options,
): ChildProcessByStdio<null, Readable, Readable> {
	return spawn(command, args, { ...options, detached: !windows, stdio: ['ignore', 'pipe', 'pipe'] })
}

// Stops a process started with `spawnTree` and all of its descendants.
export function killTree(child: ChildProcess): void {
	if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) {
		return
	}

	if (windows) {
		spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
		return
	}

	try {
		process.kill(-child.pid, 'SIGTERM')
	} catch {
		// The process group exited between the check above and the signal.
	}
}
