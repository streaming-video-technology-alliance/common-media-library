import { parseM3u8 } from '../utils/m3u8.js';
import { Presentation } from './Presentation.js';
import { SelectionSet } from './SelectionSet.js';
import { SwitchingSet } from './SwitchingSet.js';
import { uuid } from '../../utils.js';

type FetchResponse = {
    text: () => Promise<string>;
};


async function readHLS(manifestUrl: string): Promise<string> {
    const response: FetchResponse = await fetch(manifestUrl, {
        headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
        }
    });
    return response.text();
}

export async function m3u8toHam(url: string): Promise<Presentation> {
    const hls: string = await readHLS(url);
    const parsedM3u8 = parseM3u8(hls);
    const segments= parsedM3u8.playlists;

    let presentationSetDuration: number = 0;
    let selectionSets: SelectionSet[] = [];

    await Promise.all(segments.map(async (playlist: any) => {
        let segmentUrl: string[] = url.split("/");
        let segmentUrlWithoutLast: string = segmentUrl.slice(0, segmentUrl.length - 1).join("/").concat("/").concat(playlist.uri);
        let parse: string = await readHLS(segmentUrlWithoutLast);
        let parsedSegment: any = parseM3u8(parse);
        let selectionSetDuration: number = 0;
        let switchingSets: SwitchingSet[] = [];

        await Promise.all(parsedSegment.segments.map(async (segment: any) => {
            selectionSetDuration += segment.duration;
            presentationSetDuration += segment.duration;
            let type: string = segment.map ? "video" : "audio";
            let language: string = playlist.attributes.LANGUAGE;
            switchingSets.push(new SwitchingSet(uuid(), type, playlist.attributes.CODECS, segment.duration, language));
        }));

        selectionSets.push(new SelectionSet(uuid(), selectionSetDuration, switchingSets));
    }));

    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });

    return new Presentation(uuid(), presentationSetDuration, selectionSets);
}
