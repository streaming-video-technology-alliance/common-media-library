const expectedSegmentBase = [
	{
		duration: 13,
		url: 'tears-of-steel-aac-64k.cmfa',
		byteRange: '704-2211',
	},
];

const expectedSegmentList = [
	{
		duration: 10,
		url: 'testStream01bbb/video/72000/segment_0.m4s',
	},
	{
		duration: 10,
		url: 'testStream01bbb/video/72000/segment_10417.m4s',
	},
	{
		duration: 10,
		url: 'testStream01bbb/video/72000/segment_20833.m4s',
	},
];

const expectedSegmentTemplate = [
	{
		duration: 4,
		url: '1/1.m4s',
	},
	{
		duration: 4,
		url: '1/2.m4s',
	},
	{
		duration: 4,
		url: '1/3.m4s',
	},
];

export { expectedSegmentBase, expectedSegmentList, expectedSegmentTemplate };
