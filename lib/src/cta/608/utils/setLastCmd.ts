import type { CmdHistory } from '../CmdHistory';

export function setLastCmd(
	a: number | null,
	b: number | null,
	cmdHistory: CmdHistory,
): void {
	cmdHistory.a = a;
	cmdHistory.b = b;
}
