export type PackageGroup = 'Delivery' | 'Containers' | 'Captions' | 'Trust' | 'Core'

export const groupOrder: PackageGroup[] = ['Delivery', 'Containers', 'Captions', 'Trust', 'Core']

// Every published package needs a group. `loadPackage` fails for a package that is missing here.
export const groups: Record<string, PackageGroup> = {
	abr: 'Delivery',
	cmcd: 'Delivery',
	cmsd: 'Delivery',
	'content-steering': 'Delivery',
	request: 'Delivery',
	throughput: 'Delivery',
	'cmaf-ham': 'Containers',
	dash: 'Containers',
	id3: 'Containers',
	'iso-bmff': 'Containers',
	'608': 'Captions',
	cta: 'Captions',
	webvtt: 'Captions',
	c2pa: 'Trust',
	drm: 'Trust',
	'error-codes': 'Core',
	'iso-8601': 'Core',
	'structured-field-values': 'Core',
	utils: 'Core',
	xml: 'Core',
}
