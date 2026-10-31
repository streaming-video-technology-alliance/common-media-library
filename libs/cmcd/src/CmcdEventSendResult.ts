/**
 * The result of a {@link CmcdEventSender} call.
 *
 * @public
 */
export type CmcdEventSendResult = {
	/**
	 * If `true`, the target stops for the life of the session, as after a 410 response.
	 */
	readonly gone?: boolean
}
