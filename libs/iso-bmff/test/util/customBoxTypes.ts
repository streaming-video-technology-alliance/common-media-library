// The custom box types of the tests. The tests share one program, so one declaration serves every test file.
declare module '@svta/cml-iso-bmff' {
	// oxlint-disable-next-line typescript/consistent-type-definitions
	interface IsoCustomBoxMap {
		abcd: { type: 'abcd'; x: number }
		test: { type: 'test'; value: number }
		uuid: { type: 'uuid'; usertype: Uint8Array; value: number }
	}
}

export {}
