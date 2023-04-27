export class CmcdError extends Error {
	static readonly INVALID_CMCD_OBJECT = 'Invalid CMCD object';
  
	override name = 'CmcdError';
}
