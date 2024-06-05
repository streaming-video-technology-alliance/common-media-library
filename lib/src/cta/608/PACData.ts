/**
 * Represents a single PAC (Preamble Address Code) data.
 *
 * @beta
 */
export interface PACData {
	row: number;
	indent: number | null;
	color: string | null;
	underline: boolean;
	italics: boolean;
}