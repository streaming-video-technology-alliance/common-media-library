import type { CmdHistory } from '../CmdHistory';

export function hasCmdRepeated(a: number, b: number, cmdHistory: CmdHistory): boolean {
	return cmdHistory.a === a && cmdHistory.b === b;
}
