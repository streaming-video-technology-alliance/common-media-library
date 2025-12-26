/**
 * Represents a single PAC (Preamble Address Code) data.
 *
 * @public
 */
export type PACData = {
	row: number;
	indent: number | null;
	color: string | null;
	underline: boolean;
	italics: boolean;
};
