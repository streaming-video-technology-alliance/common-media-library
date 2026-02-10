# Discussion Update Generator Script

## Overview

The `generate-discussion-update.js` script automates the generation of monthly meeting discussion updates by fetching release information from the GitHub API.

## Usage

```bash
node scripts/generate-discussion-update.js [since-date]
```

### Parameters

- `since-date` (optional): ISO 8601 date string (YYYY-MM-DD) representing the date of the previous meeting. Defaults to `2026-01-13`.

### Examples

```bash
# Generate update for releases since January 13, 2026
node scripts/generate-discussion-update.js 2026-01-13

# Generate update for releases since February 10, 2026
node scripts/generate-discussion-update.js 2026-02-10
```

## How It Works

1. **Fetches Releases**: Queries the GitHub API for all releases in the repository
2. **Filters by Date**: Selects only releases published after the specified date
3. **Groups by Date**: Organizes releases chronologically
4. **Calculates Next Meeting**: Determines the second Tuesday of the next month
5. **Generates Markdown**: Outputs formatted markdown suitable for the discussion update

## Output

The script outputs markdown to stdout, which includes:
- Next meeting date and time
- List of releases grouped by publication date
- Total release count
- Links to each release on GitHub

## Requirements

- Node.js >= 20
- Network access to api.github.com (may be restricted in sandboxed environments)

## Meeting Schedule

Monthly meetings are held on the **second Tuesday of each month at 8:00 AM PST**.

## Future Enhancements

This script could be integrated into:
- A GitHub Actions workflow that runs automatically
- A pre-meeting preparation workflow
- An automated discussion posting system (with appropriate GitHub token and permissions)
