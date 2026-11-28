// The custom box types of the tests. The tests share one program, so one declaration serves every test file.
export const TEST_USER_TYPE = '01020304-0506-0708-090a-0b0c0d0e0f10'

declare module '@svta/cml-iso-bmff' {
	// oxlint-disable-next-line typescript/consistent-type-definitions
	interface IsoCustomBoxMap {
		abcd: { type: 'abcd'; x: number }
		test: { type: 'test'; value: number }
	}

	// oxlint-disable-next-line typescript/consistent-type-definitions
	interface IsoCustomUuidBoxMap {
		[TEST_USER_TYPE]: {
			type: 'uuid'
			userType: typeof TEST_USER_TYPE
			value: number
		}
	}
}
