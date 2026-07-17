# @svta/cml-mse

Media Source Extensions (MSE) utilities for the Common Media Library.

`SourceBuffer` methods such as `appendBuffer` and `remove` expose a
synchronous interface but actually operate asynchronously: the buffer's
`updating` flag must be respected, and calling a mutating method again
before the previous one finishes throws. This is easy to get wrong in
anything beyond trivial usage. `AsyncSourceBuffer` wraps a native
`SourceBuffer` and queues operations so you can just `await` them instead
of tracking `updating` and the `updateend`/`abort`/`error` events yourself.

## Installation

```bash
npm install @svta/cml-mse
```

## Features

- **Action queue** — `appendBuffer`, `remove`, `changeType`, and every
  property update are queued and run one at a time, only once the buffer
  is ready.
- **Promise-based outcomes** — each queued action returns a promise that:
  - resolves `true` once the action completed successfully,
  - resolves `false` if it was aborted,
  - or rejects if an error occurred.
- **Familiar API** — `AsyncSourceBuffer` mirrors the native `SourceBuffer`
  surface (`appendBuffer`, `remove`, `changeType`, `mode`,
  `timestampOffset`, `appendWindowStart`/`appendWindowEnd`, `buffered`,
  `abort`), so there's nothing new to learn beyond `await`ing the result.

## Usage

```typescript
import { AsyncSourceBuffer } from '@svta/cml-mse'

function setupMediaSource(video: HTMLVideoElement) {
	const mediaSource = new MediaSource()
	video.src = URL.createObjectURL(mediaSource)

	mediaSource.addEventListener('sourceopen', async () => {
		const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.64001e"')
		const asyncSourceBuffer = new AsyncSourceBuffer(sourceBuffer)

		try {
			const response = await fetch('video-segment.mp4')
			const data = await response.arrayBuffer()

			const appendResult = await asyncSourceBuffer.appendBuffer(data)
			console.log('Append successful:', appendResult)

			const removeResult = await asyncSourceBuffer.remove(0, 5)
			console.log('Remove successful:', removeResult)

			const clearResult = await asyncSourceBuffer.clear(/* clearQueue = */ false)
			console.log('Clear successful:', clearResult)
		} catch (error) {
			console.error('Error in MSE operations:', error)
		} finally {
			// Removes the listeners attached to the source buffer.
			asyncSourceBuffer.release()
		}
	})
}
```

## License

Apache-2.0
