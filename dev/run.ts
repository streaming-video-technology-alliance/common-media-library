import { appendCmcdQuery, CmcdObjectType } from '@svta.org/common-media-library';

const url = 'https://example.com/playlist.m3u8';
const cmcd = {
	sid: '4f2867f2-b0fd-4db7-a3e0-cea7dff44cfb',
	cid: 'cc002fc3-d9e1-418d-9a5f-3d0eac601882',
	d: 324.69,
	ot: CmcdObjectType.MANIFEST,
	['com.example-hello']: 'world',
};

const cmcdUrl = appendCmcdQuery(cmcd, url);
console.log(cmcdUrl);
// https://example.com/playlist.m3u8?CMCD=cid%3D%22cc002fc3-d9e1-418d-9a5f-3d0eac601882%22%2Ccom.example-hello%3D%22world%22%2Cd%3D325%2Cot%3Dm%2Csid%3D%224f2867f2-b0fd-4db7-a3e0-cea7dff44cfb%22
