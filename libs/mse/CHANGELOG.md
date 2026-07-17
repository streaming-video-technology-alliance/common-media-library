# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-07-17

### Added

- `AsyncSourceBuffer`, a promise-based wrapper around the native
  `SourceBuffer` that queues `appendBuffer`/`remove`/`changeType` and
  property updates so callers can `await` them instead of manually
  tracking the `updating` flag and `updateend`/`abort`/`error` events.
  Ported from [async-mse](https://github.com/thasso/async-mse) (MIT
  licensed, see `NOTICE.md`).
## [0.0.1] - 2026-01-12

### Added

- Initial package setup
