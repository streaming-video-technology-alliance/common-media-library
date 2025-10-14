import type { Fields } from '../boxes/Fields.ts';
import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a WebVTTConfigurationBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVttConfigurationBox
 *
 *
 * @beta
 */
export function vttC(view: IsoView): Fields<WebVttConfigurationBox> {
	return {
		config: view.readUtf8(),
	};
};
