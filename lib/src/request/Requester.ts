import type { CommonMediaRequest } from './CommonMediaRequest';
import type { CommonMediaResponse } from './CommonMediaResponse';

export type Requester = (request: CommonMediaRequest) => Promise<CommonMediaResponse>;
