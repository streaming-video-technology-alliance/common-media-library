# Changelog

## 0.1.0

- Initial release
- HTTP proxy that captures CMCD data from query parameters and headers
- Event collection endpoint for CMCD v2 event reports (`text/cmcd` and `application/json`)
- Reports endpoint with session ID filtering and type filtering
- HLS and DASH manifest URL rewriting for transparent proxying
- JSONL flat-file storage for reports
- CLI with `--upstream`, `--port`, and `--db` options
