import { STEERING_ERROR_TYPE_CALLBACK, STEERING_ERROR_TYPE_LOAD, STEERING_ERROR_TYPE_PARSE, SteeringErrorType } from '@svta/cml-content-steering'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('SteeringErrorType', () => {
	it('has the load, parse, and callback values', () => {
		//#region example
		equal(SteeringErrorType.LOAD, 'load')
		equal(SteeringErrorType.PARSE, 'parse')
		equal(SteeringErrorType.CALLBACK, 'callback')
		equal(STEERING_ERROR_TYPE_LOAD, SteeringErrorType.LOAD)
		equal(STEERING_ERROR_TYPE_PARSE, SteeringErrorType.PARSE)
		equal(STEERING_ERROR_TYPE_CALLBACK, SteeringErrorType.CALLBACK)
		//#endregion example
	})
})
