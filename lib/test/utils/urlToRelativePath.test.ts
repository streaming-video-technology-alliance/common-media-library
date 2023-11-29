import { urlToRelativePath } from '@svta/common-media-library/utils/urlToRelativePath';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('urlToRelativePath', () => {
	it('produces a relative path when at root', () => {
		equal(urlToRelativePath('http://test.com/1.mp4', 'http://test.com/manifest.mpd'), '1.mp4');
	});

	it('produces a relative path when at the same folder level', () => {
		equal(urlToRelativePath('http://test.com/base/1.mp4', 'http://test.com/base/manifest.mpd'), '1.mp4');
	});

	it('produces a relative path when base is lower', () => {
		equal(urlToRelativePath('http://test.com/base/segments/video/1.mp4', 'http://test.com/manifest.mpd'), 'base/segments/video/1.mp4');
	});

	it('produces a relative path when base is higher', () => {
		equal(urlToRelativePath('http://test.com/1.mp4', 'http://test.com/base/manifest/manifest.mpd'), '../../1.mp4');
	});

	it('produces a relative path when base and url are different', () => {
		equal(urlToRelativePath('http://test.com/base/segments/video/1.mp4', 'http://test.com/base/manifest/manifest.mpd'), '../segments/video/1.mp4');

	});

	it('return url when origins are different', () => {
		equal(urlToRelativePath('http://foo.com/1.mp4', 'http://test.com/base/manifest/manifest.mpd'), 'http://foo.com/1.mp4');
	});
});
