import { SfBareItem } from './SfBareItem.js';
import { SfItem } from './SfItem.js';
import { SfParameters } from './SfParameters.js';

export type SfInnerList = {
  value: SfItem[] | SfBareItem[],
  params: SfParameters,
};
