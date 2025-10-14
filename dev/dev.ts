import { appendCmcdQuery } from '@svta/cml-cmcd'

console.log(appendCmcdQuery('https://test.com/?CMCD=bs%2Cot%3Dm%2Csf%3Dh', { mtp: 123 }))
