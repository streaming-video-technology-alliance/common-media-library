import type { Fields } from '../boxes/Fields.js';
import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a WebVTTConfigurationBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVttConfigurationBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function vttC(view: IsoView): Fields<WebVttConfigurationBox> {
	return {
		config: view.readUtf8(),
	};
};
