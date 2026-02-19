import { parseArgs } from 'node:util'
import { startServer } from './server.ts'

const { values } = parseArgs({
	options: {
		port: { type: 'string', short: 'p', default: '2623' },
		db: { type: 'string', default: './cmcd-reports.db' },
		help: { type: 'boolean', short: 'h', default: false },
	},
})

if (values.help) {
	console.log(`CMCD Validator - A validation service for Common Media Client Data

Usage: cmcd-validator [options]

Options:
  -p, --port <port>       Server port (default: 2623)
      --db <path>         Database file path (default: ./cmcd-reports.db)
  -h, --help              Show this help message

Endpoints:
  POST   /cmcd/event/:id      Collect CMCD v2 event reports
  GET    /sessions             List all session IDs
  GET    /reports              List all reports
  GET    /reports/:sessionId   List reports for a session
  DELETE /reports              Clear all reports
  GET    /health               Health check

Example:
  cmcd-validator --port 8080
`)
	process.exit(0)
}

startServer({
	port: parseInt(values.port, 10),
	dbPath: values.db,
})
