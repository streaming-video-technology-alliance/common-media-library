import type { Segment } from '@svta/cml-cmaf-ham'

const expectedSegmentBase: Segment[] = [
	{
		id: 'audio_eng=64349-segment-0',
		duration: 13,
		url: 'tears-of-steel-aac-64k.cmfa',
		byteRange: { start: 704, end: 2211 },
		startTime: 0,
		parent: null as any,
	},
]

const expectedSegmentList: Segment[] = [
	{
		id: 'segment-0',
		duration: 10,
		url: 'testStream01bbb/video/72000/segment_0.m4s',
		startTime: 0,
		parent: null as any,
	},
	{
		id: 'segment-1',
		duration: 10,
		url: 'testStream01bbb/video/72000/segment_10417.m4s',
		startTime: 10,
		parent: null as any,
	},
	{
		id: 'segment-2',
		duration: 10,
		url: 'testStream01bbb/video/72000/segment_20833.m4s',
		startTime: 20,
		parent: null as any,
	},
]

const expectedSegmentTemplate: Segment[] = [
	{
		id: '1-segment-1',
		duration: 4,
		url: '1/0001.m4s',
		startTime: 0,
		parent: null as any,
	},
	{
		id: '1-segment-2',
		duration: 4,
		url: '1/0002.m4s',
		startTime: 4,
		parent: null as any,
	},
	{
		id: '1-segment-3',
		duration: 4,
		url: '1/0003.m4s',
		startTime: 8,
		parent: null as any,
	},
]

export { expectedSegmentBase, expectedSegmentList, expectedSegmentTemplate }
