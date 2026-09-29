import { STEERING_PROTOCOL_DASH, STEERING_PROTOCOL_HLS, SteeringProtocol } from '@svta/cml-content-steering'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('SteeringProtocol', () => {
	it('has the HLS and DASH values', () => {
		//#region example
		equal(SteeringProtocol.HLS, 'hls')
		equal(SteeringProtocol.DASH, 'dash')
		equal(STEERING_PROTOCOL_HLS, SteeringProtocol.HLS)
		equal(STEERING_PROTOCOL_DASH, SteeringProtocol.DASH)
		//#endregion example
	})
})
