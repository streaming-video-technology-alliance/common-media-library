import { readArdi } from './readArdi.ts'
import { readAvc1 } from './readAvc1.ts'
import { readAvc2 } from './readAvc2.ts'
import { readAvc3 } from './readAvc3.ts'
import { readAvc4 } from './readAvc4.ts'
import { readCtts } from './readCtts.ts'
import { readDref } from './readDref.ts'
import { readElng } from './readElng.ts'
import { readElst } from './readElst.ts'
import { readEmsg } from './readEmsg.ts'
import { readEnca } from './readEnca.ts'
import { readEncv } from './readEncv.ts'
import { readFree } from './readFree.ts'
import { readFrma } from './readFrma.ts'
import { readFtyp } from './readFtyp.ts'
import { readHdlr } from './readHdlr.ts'
import { readHev1 } from './readHev1.ts'
import { readHvc1 } from './readHvc1.ts'
import { readIden } from './readIden.ts'
import { readImda } from './readImda.ts'
import { readKind } from './readKind.ts'
import { readLabl } from './readLabl.ts'
import { readMdat } from './readMdat.ts'
import { readMdhd } from './readMdhd.ts'
import { readMehd } from './readMehd.ts'
import { readMeta } from './readMeta.ts'
import { readMfhd } from './readMfhd.ts'
import { readMfro } from './readMfro.ts'
import { readMp4a } from './readMp4a.ts'
import { readMvhd } from './readMvhd.ts'
import { readPayl } from './readPayl.ts'
import { readPrft } from './readPrft.ts'
import { readPrsl } from './readPrsl.ts'
import { readPssh } from './readPssh.ts'
import { readSchm } from './readSchm.ts'
import { readSdtp } from './readSdtp.ts'
import { readSidx } from './readSidx.ts'
import { readSkip } from './readSkip.ts'
import { readSmhd } from './readSmhd.ts'
import { readSsix } from './readSsix.ts'
import { readSthd } from './readSthd.ts'
import { readStsd } from './readStsd.ts'
import { readStss } from './readStss.ts'
import { readSttg } from './readSttg.ts'
import { readStts } from './readStts.ts'
import { readStyp } from './readStyp.ts'
import { readSubs } from './readSubs.ts'
import { readTenc } from './readTenc.ts'
import { readTfdt } from './readTfdt.ts'
import { readTfhd } from './readTfhd.ts'
import { readTfra } from './readTfra.ts'
import { readTkhd } from './readTkhd.ts'
import { readTrex } from './readTrex.ts'
import { readTrun } from './readTrun.ts'
import { readUrl } from './readUrl.ts'
import { readUrn } from './readUrn.ts'
import { readVlab } from './readVlab.ts'
import { readVmhd } from './readVmhd.ts'
import { readVttC } from './readVttC.ts'
import { readVtte } from './readVtte.ts'

/**
 * The reader map of `defaultReaderConfig`. Every key is a box type and the
 * value is the built-in reader of that box.
 *
 * Spread the map into a custom map to replace one reader. The result type of
 * `readIsoBoxes` then has the return type of the custom reader and the
 * built-in types of the other boxes.
 *
 * @example
 * {@includeCode ../../test/readIsoBoxes.test.ts#spread}
 *
 * @public
 */
export type DefaultReaderMap = {
	ardi: typeof readArdi
	avc1: typeof readAvc1
	avc2: typeof readAvc2
	avc3: typeof readAvc3
	avc4: typeof readAvc4
	ctts: typeof readCtts
	dref: typeof readDref
	elng: typeof readElng
	elst: typeof readElst
	emsg: typeof readEmsg
	enca: typeof readEnca
	encv: typeof readEncv
	free: typeof readFree
	frma: typeof readFrma
	ftyp: typeof readFtyp
	hdlr: typeof readHdlr
	hev1: typeof readHev1
	hvc1: typeof readHvc1
	iden: typeof readIden
	imda: typeof readImda
	kind: typeof readKind
	labl: typeof readLabl
	mdat: typeof readMdat
	mdhd: typeof readMdhd
	mehd: typeof readMehd
	meta: typeof readMeta
	mfhd: typeof readMfhd
	mfro: typeof readMfro
	mp4a: typeof readMp4a
	mvhd: typeof readMvhd
	payl: typeof readPayl
	prft: typeof readPrft
	prsl: typeof readPrsl
	pssh: typeof readPssh
	schm: typeof readSchm
	sdtp: typeof readSdtp
	sidx: typeof readSidx
	skip: typeof readSkip
	smhd: typeof readSmhd
	ssix: typeof readSsix
	sthd: typeof readSthd
	stsd: typeof readStsd
	stss: typeof readStss
	sttg: typeof readSttg
	stts: typeof readStts
	styp: typeof readStyp
	subs: typeof readSubs
	tenc: typeof readTenc
	tfdt: typeof readTfdt
	tfhd: typeof readTfhd
	tfra: typeof readTfra
	tkhd: typeof readTkhd
	trex: typeof readTrex
	trun: typeof readTrun
	'url ': typeof readUrl
	'urn ': typeof readUrn
	vlab: typeof readVlab
	vmhd: typeof readVmhd
	vttC: typeof readVttC
	vtte: typeof readVtte
}

/**
 * Create a default reader configuration with all available readers pre-configured.
 *
 * The result type of `readIsoBoxes` with this configuration has every box
 * type that a built-in reader returns.
 *
 * @returns A configuration whose `readers` is a `DefaultReaderMap`
 *
 * @public
 */
export function defaultReaderConfig(): { readers: DefaultReaderMap } {
	return {
		readers: {
			ardi: readArdi,
			avc1: readAvc1,
			avc2: readAvc2,
			avc3: readAvc3,
			avc4: readAvc4,
			ctts: readCtts,
			dref: readDref,
			elng: readElng,
			elst: readElst,
			emsg: readEmsg,
			enca: readEnca,
			encv: readEncv,
			free: readFree,
			frma: readFrma,
			ftyp: readFtyp,
			hdlr: readHdlr,
			hev1: readHev1,
			hvc1: readHvc1,
			iden: readIden,
			imda: readImda,
			kind: readKind,
			labl: readLabl,
			mdat: readMdat,
			mdhd: readMdhd,
			mehd: readMehd,
			meta: readMeta,
			mfhd: readMfhd,
			mfro: readMfro,
			mp4a: readMp4a,
			mvhd: readMvhd,
			payl: readPayl,
			prft: readPrft,
			prsl: readPrsl,
			pssh: readPssh,
			schm: readSchm,
			sdtp: readSdtp,
			sidx: readSidx,
			skip: readSkip,
			smhd: readSmhd,
			ssix: readSsix,
			sthd: readSthd,
			stsd: readStsd,
			stss: readStss,
			sttg: readSttg,
			stts: readStts,
			styp: readStyp,
			subs: readSubs,
			tenc: readTenc,
			tfdt: readTfdt,
			tfhd: readTfhd,
			tfra: readTfra,
			tkhd: readTkhd,
			trex: readTrex,
			trun: readTrun,
			'url ': readUrl,
			'urn ': readUrn,
			vlab: readVlab,
			vmhd: readVmhd,
			vttC: readVttC,
			vtte: readVtte,
		},
	}
}
