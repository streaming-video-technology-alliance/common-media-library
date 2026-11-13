/**
 * Creates the error of a session argument that breaks a rule.
 *
 * @param parameter - The name of the argument.
 * @param expected - The valid values.
 * @param received - The received value.
 * @returns The error. Its message names the parameter, the valid values, and the received value.
 *
 * @internal
 */
export function configError(parameter: string, expected: string, received: unknown): Error {
	const value =
		typeof received === 'string' || Array.isArray(received)
			? JSON.stringify(received)
			: String(received)

	return new Error(`createCmcdSession: ${parameter} must be ${expected}, received ${value}`)
}
