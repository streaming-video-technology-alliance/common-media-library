import type { Segment } from '@svta/cml-cmaf-ham'

const expectedSegmentBase: Segment[] = [
	{
		duration: 13,
		url: 'tears-of-steel-aac-64k.cmfa',
		byteRange: '704-2211',
	},
]

const expectedSegmentList: Segment[] = [
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
]

const expectedSegmentTemplate: Segment[] = [
	{
		duration: 4,
		url: '1/0001.m4s',
	},
	{
		duration: 4,
		url: '1/0002.m4s',
	},
	{
		duration: 4,
		url: '1/0003.m4s',
	},
]

export { expectedSegmentBase, expectedSegmentList, expectedSegmentTemplate }
