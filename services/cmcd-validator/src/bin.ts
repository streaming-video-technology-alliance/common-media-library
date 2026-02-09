import { parseArgs } from 'node:util'
import { startServer } from './server.ts'

const { values } = parseArgs({
	options: {
		port: { type: 'string', short: 'p', default: '2623' },
		upstream: { type: 'string', short: 'u' },
		db: { type: 'string', default: './cmcd-reports.jsonl' },
		help: { type: 'boolean', short: 'h', default: false },
	},
})

if (values.help) {
	console.log(`CMCD Validator - A verification proxy for Common Media Client Data

Usage: cmcd-validator [options]

Options:
  -p, --port <port>       Server port (default: 2623)
  -u, --upstream <url>    Upstream base URL (required)
      --db <path>         Database file path (default: ./cmcd-reports.jsonl)
  -h, --help              Show this help message

Endpoints:
  GET    /proxy/*            Proxy requests to upstream, capture CMCD data
  POST   /cmcd/event         Collect CMCD v2 event reports
  GET    /reports             List all reports
  GET    /reports/:sessionId  List reports for a session
  DELETE /reports             Clear all reports
  GET    /health              Health check

Example:
  cmcd-validator --upstream https://cdn.example.com --port 8080
`)
	process.exit(0)
}

if (!values.upstream) {
	console.error('Error: --upstream <url> is required')
	process.exit(1)
}

startServer({
	port: parseInt(values.port!, 10),
	upstream: values.upstream,
	dbPath: values.db!,
})
