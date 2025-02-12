import { processUriTemplate } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('processUriTemplate', () => {
	it('handles a single RepresentationID identifier', () => {
		equal(
			processUriTemplate(
				'/example/$RepresentationID$.mp4',
				'100', null, null, null, null,
			),
			'/example/100.mp4',
		);

		// RepresentationID cannot use a width specifier.
		equal(
			processUriTemplate(
				'/example/$RepresentationID%01d$.mp4',
				'100', null, null, null, null,
			),
			'/example/100.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$RepresentationID$.mp4',
				null, null, null, null, null,
			),
			'/example/$RepresentationID$.mp4',
		);
	});

	it('handles a single Number identifier', () => {
		equal(
			processUriTemplate(
				'/example/$Number$.mp4',
				null, 100, null, null, null,
			),
			'/example/100.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$Number%05d$.mp4',
				null, 100, null, null, null,
			),
			'/example/00100.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$Number$.mp4',
				null, null, null, null, null,
			),
			'/example/$Number$.mp4',
		);
	});

	it('handles a single SubNumber identifier', () => {
		equal(
			processUriTemplate(
				'/example/$SubNumber$.mp4',
				null, null, 100, null, null,
			),
			'/example/100.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$SubNumber%05d$.mp4',
				null, null, 100, null, null,
			),
			'/example/00100.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$SubNumber$.mp4',
				null, null, null, null, null,
			),
			'/example/$SubNumber$.mp4',
		);
	});

	it('handles a single Bandwidth identifier', () => {
		equal(
			processUriTemplate(
				'/example/$Bandwidth$.mp4',
				null, null, null, 100, null,
			),
			'/example/100.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$Bandwidth%05d$.mp4',
				null, null, null, 100, null,
			),
			'/example/00100.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$Bandwidth$.mp4',
				null, null, null, null, null,
			),
			'/example/$Bandwidth$.mp4',
		);
	});

	it('handles a single Time identifier', () => {
		equal(
			processUriTemplate(
				'/example/$Time$.mp4',
				null, null, null, null, 100,
			),
			'/example/100.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$Time%05d$.mp4',
				null, null, null, null, 100,
			),
			'/example/00100.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$Time$.mp4',
				null, null, null, null, null,
			),
			'/example/$Time$.mp4',
		);
	});

	it('handles rounding errors for calculated Times', () => {
		equal(
			processUriTemplate(
				'/example/$Time$.mp4',
				null, null, null, null, 100.0001,
			),
			'/example/100.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$Time%05d$.mp4',
				null, null, null, null, 99.9999,
			),
			'/example/00100.mp4',
		);
	});

	it('handles multiple identifiers', () => {
		equal(
			processUriTemplate(
				'/example/$RepresentationID$_$Number$_$SubNumber$_$Bandwidth$_$Time$.mp4',
				'1', 2, 3, 4, 5,
			),
			'/example/1_2_3_4_5.mp4',
		);

		// No spaces.
		equal(
			processUriTemplate(
				'/example/$RepresentationID$$Number$$SubNumber$$Bandwidth$$Time$.mp4',
				'1', 2, 3, 4, 5,
			),
			'/example/12345.mp4',
		);

		// Different order.
		equal(
			processUriTemplate(
				'/example/$SubNumber$_$Bandwidth$_$Time$_$RepresentationID$_$Number$.mp4',
				'1', 2, 3, 4, 5,
			),
			'/example/3_4_5_1_2.mp4',
		);

		// Single width.
		equal(
			processUriTemplate(
				'$RepresentationID$_$Number%01d$_$SubNumber%01d$_$Bandwidth%01d$_$Time%01d$',
				'1', 2, 3, 4, 500,
			),
			'1_2_3_4_500',
		);

		// Different widths.
		equal(
			processUriTemplate(
				'$RepresentationID$_$Number%02d$_$SubNumber%02d$_$Bandwidth%02d$_$Time%02d$',
				'1', 2, 3, 4, 5,
			),
			'1_02_03_04_05',
		);

		// Double $$.
		equal(
			processUriTemplate(
				'$$/$RepresentationID$$$$Number$$$$SubNumber$$$$Bandwidth$$$$Time$$$.$$',
				'1', 2, 3, 4, 5,
			),
			'$/1$2$3$4$5$.$',
		);
	});

	it('handles invalid identifiers', () => {
		equal(
			processUriTemplate(
				'/example/$Garbage$.mp4',
				'1', 2, 3, 4, 5,
			),
			'/example/$Garbage$.mp4',
		);

		equal(
			processUriTemplate(
				'/example/$Time.mp4',
				'1', 2, 3, 4, 5,
			),
			'/example/$Time.mp4',
		);
	});

	it('handles non-decimal format specifiers', () => {
		equal(
			processUriTemplate(
				'/$Number%05x$_$Number%01X$_$Number%01u$_$Number%01o$.mp4',
				'', 180, 0, 0, 0,
			),
			'/000b4_B4_180_264.mp4',
		);
	});
});
