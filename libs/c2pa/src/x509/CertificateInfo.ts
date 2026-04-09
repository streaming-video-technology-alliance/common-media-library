/**
 * Information extracted from an X.509 DER certificate
 *
 * @public
 */
export type CertificateInfo = {
	readonly issuer: string
	readonly notBefore: string | null
}
