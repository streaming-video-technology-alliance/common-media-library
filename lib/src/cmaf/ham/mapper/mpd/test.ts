import { mpdToHam } from "../../services/converters/mpdConverter";
import fs from "fs";
//convert mpd to ham
const mpd = fs.readFileSync("test.mpd", "utf8");
const ham = mpdToHam(mpd);
console.log(ham);

