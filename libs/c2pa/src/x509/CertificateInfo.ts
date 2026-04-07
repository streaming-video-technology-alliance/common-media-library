/**
 * Information extracted from an X.509 DER certificate
 *
 * @internal
 */
export type CertificateInfo = {
	readonly issuer: string
	readonly notBefore: string | null
}
