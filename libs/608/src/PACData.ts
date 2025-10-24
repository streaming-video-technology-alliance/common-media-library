/**
 * Represents a single PAC (Preamble Address Code) data.
 *
 * @beta
 */
export type PACData = {
	row: number;
	indent: number | null;
	color: string | null;
	underline: boolean;
	italics: boolean;
};
