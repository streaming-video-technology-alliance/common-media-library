import {
	validatePresentation,
	validateSegments,
	validateTrack,
} from '@svta/cml-cmaf-ham'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import {
	audioTrack,
	invalidAudioTrack,
	invalidPresentation,
	invalidSegments,
	invalidVideoTrack,
	presentation,
	videoSegments,
	videoTrack,
} from './data/hamSamples.ts'

describe('validatePresentation', () => {
	it('it returns true when presentation is valid', () => {
		const validate = validatePresentation(presentation)

		equal(validate.status, true)
		deepEqual(validate.errorMessages, [])
	})

	it('it returns false when presentation is invalid', () => {
		const validate = validatePresentation(invalidPresentation)

		equal(validate.status, false)
		deepEqual(validate.errorMessages, [
			'Presentation id is undefined',
			'Track id is undefined in the switching set with id = video',
			'Segment url is undefined.',
			'All the tracks must have the same duration in the switching set with id = video',
			'AudioTrack with id: 1 does not have codec in the switching set with id = video',
		])
	})
})

describe('validateTrack', () => {
	it('it returns true when video track is valid', () => {
		const validate = validateTrack(videoTrack)

		equal(validate.status, true)
		deepEqual(validate.errorMessages, [])
	})

	it('it returns true when audio track is valid', () => {
		const validate = validateTrack(audioTrack)

		equal(validate.status, true)
		deepEqual(validate.errorMessages, [])
	})

	it('it returns false when video track is invalid', () => {
		const validate = validateTrack(invalidVideoTrack)

		equal(validate.status, false)
		deepEqual(validate.errorMessages, [
			'Track id is undefined.',
			'Segment url is undefined.',
		])
	})

	it('it returns false when audio track is invalid', () => {
		const validate = validateTrack(invalidAudioTrack)

		equal(validate.status, false)
		deepEqual(validate.errorMessages, [
			'AudioTrack with id: 1 does not have codec.',
		])
	})
})

describe('validateSegments', () => {
	it('it returns true when segment list is valid', () => {
		const validate = validateSegments(videoSegments)

		equal(validate.status, true)
		deepEqual(validate.errorMessages, [])
	})

	it('it returns false when segment list is invalid', () => {
		const validate = validateSegments(invalidSegments)

		equal(validate.status, false)
		deepEqual(validate.errorMessages, [
			'Segment duration is undefined.',
			'Segment duration is undefined.',
			'Segment url is undefined.',
			'Segment url is undefined.',
		])
	})
})
