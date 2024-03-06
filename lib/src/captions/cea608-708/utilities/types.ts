export type PenStyles = {
    foreground: string | null;
    underline: boolean;
    italics: boolean;
    background: string;
    flash: boolean;
  };

export type CaptionModes =
| 'MODE_ROLL-UP'
| 'MODE_POP-ON'
| 'MODE_PAINT-ON'
| 'MODE_TEXT'
| null;
  
export type SupportedField = 1 | 3;
  
export type Channels = 0 | 1 | 2; // Will be 1 or 2 when parsing captions
  
export type CmdHistory = {
    a: number | null;
    b: number | null;
};

export interface PACData {
    row: number;
    indent: number | null;
    color: string | null;
    underline: boolean;
    italics: boolean;
  }
