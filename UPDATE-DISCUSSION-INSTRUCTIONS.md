# Instructions for Updating Discussion #317

This document provides instructions for updating GitHub Discussion #317 with the monthly meeting information.

## Quick Start

The file `DISCUSSION-317-UPDATE.md` contains the pre-generated update content that is ready to be copied into the discussion.

## Steps to Update the Discussion

1. **Navigate to the discussion:**
   https://github.com/streaming-video-technology-alliance/common-media-library/discussions/317

2. **Edit the discussion post** (requires appropriate permissions - typically maintainer or admin)
   - Click the "..." menu in the top-right corner of the discussion post
   - Select "Edit"

3. **Replace or append the content**
   - Copy the entire content from `DISCUSSION-317-UPDATE.md`
   - Paste it into the discussion editor
   - You may want to preserve any existing content above or below the update

4. **Save the changes**
   - Click "Update comment" to save

## Content Summary

The update in `DISCUSSION-317-UPDATE.md` includes:

- **Next Meeting Date**: March 10, 2026 at 8:00 AM PST (second Tuesday of the month)
- **Release Summary**: 30 releases across 14 packages since the January 13, 2026 meeting
- **Notable Releases**: 
  - 🎉 @svta/cml-iso-bmff v1.0.0 (first stable release!)
  - @svta/cml-cmcd with three updates
  - @svta/cml-utils with two minor version bumps
  - @svta/cml-request with four patch updates

## Why Manual Update?

GitHub Discussions cannot be updated through git operations or the command line without authentication. The discussion content exists only on GitHub's servers and requires:
- Valid GitHub authentication
- Appropriate repository permissions (maintainer/admin)
- Use of GitHub's web interface or authenticated API calls

The files created in this repository provide the content in an easy-to-copy format.

## Automated Updates (Future Enhancement)

For future meetings, this process could be automated using:

1. **GitHub Actions workflow** that runs monthly:
   - Scheduled to run after the monthly meeting
   - Uses GitHub GraphQL API to update discussions programmatically
   - Requires a GitHub token with appropriate permissions

2. **Script using GitHub CLI** (see `scripts/generate-discussion-update.js`):
   - Can fetch releases programmatically
   - Generate the markdown content
   - Would still require manual posting or authenticated API access

## Files Created

- `DISCUSSION-317-UPDATE.md` - The formatted content ready to be pasted into the discussion
- `UPDATE-DISCUSSION-INSTRUCTIONS.md` - This instruction file (you are here)
- `scripts/generate-discussion-update.js` - Node.js script for generating future updates (requires external network access)
