import type { Fields } from '../boxes/Fields.ts'
import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a WebVTTConfigurationBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVttConfigurationBox
 *
 * @public
 */
export function readVttC(view: IsoBoxReadView): Fields<WebVttConfigurationBox> {
	return {
		config: view.readUtf8(),
	}
};
