#!/usr/bin/env node

/**
 * Script to generate monthly meeting discussion update
 * 
 * This script:
 * 1. Fetches all releases since a given date
 * 2. Groups them by date
 * 3. Calculates the next meeting date (2nd Tuesday of next month)
 * 4. Generates formatted markdown for the discussion update
 * 
 * Usage:
 *   node scripts/generate-discussion-update.js [since-date]
 * 
 * Example:
 *   node scripts/generate-discussion-update.js 2026-01-13
 */

import https from 'https';

const REPO_OWNER = 'streaming-video-technology-alliance';
const REPO_NAME = 'common-media-library';

function getSecondTuesday(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDay.getDay();
  
  // Calculate days until first Tuesday (Tuesday = 2)
  // If the 1st is already a Tuesday, daysUntilTuesday will be 0, 
  // making the 1st the first Tuesday of the month
  const daysUntilTuesday = (2 - firstDayOfWeek + 7) % 7;
  const firstTuesday = new Date(year, month - 1, 1 + daysUntilTuesday);
  
  // Second Tuesday is 7 days after first Tuesday
  const secondTuesday = new Date(firstTuesday.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return secondTuesday;
}

function formatDate(date) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function fetchReleases(callback) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=100`,
    method: 'GET',
    headers: {
      'User-Agent': 'CML-Discussion-Generator',
      'Accept': 'application/vnd.github.v3+json'
    }
  };

  https.get(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => callback(null, JSON.parse(data)));
  }).on('error', (err) => callback(err));
}

function generateUpdate(sinceDate) {
  fetchReleases((err, releases) => {
    if (err) {
      console.error('Error fetching releases:', err);
      process.exit(1);
    }

    // Filter releases since the given date
    const filteredReleases = releases.filter(r => {
      const releaseDate = new Date(r.published_at);
      const since = new Date(sinceDate);
      return releaseDate >= since;
    });

    // Group by date
    const byDate = {};
    filteredReleases.forEach(release => {
      const date = release.published_at.split('T')[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(release);
    });

    // Calculate next meeting (second Tuesday of next month)
    const now = new Date();
    let nextMonth = now.getMonth() + 1; // Get next month (0-indexed)
    let nextYear = now.getFullYear();
    if (nextMonth > 11) { // JavaScript months are 0-11
      nextMonth = 0; // January of next year
      nextYear++;
    }
    const nextMeeting = getSecondTuesday(nextYear, nextMonth + 1); // getSecondTuesday expects 1-indexed month

    // Generate markdown
    console.log('# Monthly Meeting Discussion Update');
    console.log('');
    console.log('## Next Meeting');
    console.log('');
    console.log(`**Date:** ${formatDate(nextMeeting)} at 8:00 AM PST`);
    console.log('');
    console.log(`## Releases Since Previous Meeting (${sinceDate})`);
    console.log('');
    console.log(`The following ${filteredReleases.length} releases have been published since our last meeting:`);
    console.log('');

    // Sort dates
    const sortedDates = Object.keys(byDate).sort();
    
    sortedDates.forEach(date => {
      const d = new Date(date);
      console.log(`### ${formatDate(d)}`);
      byDate[date].forEach(release => {
        console.log(`- [${release.name}](${release.html_url})`);
      });
      console.log('');
    });

    console.log('---');
    console.log('');
    console.log(`**Total:** ${filteredReleases.length} releases`);
  });
}

// Main
const sinceDate = process.argv[2] || '2026-01-13';
generateUpdate(sinceDate);
