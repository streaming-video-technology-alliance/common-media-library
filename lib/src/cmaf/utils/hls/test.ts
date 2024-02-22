import { hamToM3u8, m3u8toHamFromUrl } from '../../ham/manifestParser.js';
import { renderHls } from './m3u8.js';
async function  test() {
	const test = await m3u8toHamFromUrl('https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/ToS_AVC_HEVC_MutliRate_MultiRes_IFrame_AAC.m3u8');
	const test2 = await hamToM3u8(test);
    console.log(test2);
	const render = renderHls(test2);
	console.log(render);
	return render;
}

(async () => {
	const hola = await test();
    const parsed = JSON.parse(hola);
    console.log(parsed);
})();
