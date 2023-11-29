import { appendCmcdQuery } from '@svta/common-media-library/cmcd/appendCmcdQuery.js';

console.log(appendCmcdQuery('https://test.com/?CMCD=bs%2Cot%3Dm%2Csf%3Dh', { mtp: 123 }));
