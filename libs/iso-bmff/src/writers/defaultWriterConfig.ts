import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeArdi } from './writeArdi.ts'
import { writeAvc1 } from './writeAvc1.ts'
import { writeAvc2 } from './writeAvc2.ts'
import { writeAvc3 } from './writeAvc3.ts'
import { writeAvc4 } from './writeAvc4.ts'
import { writeCtts } from './writeCtts.ts'
import { writeDref } from './writeDref.ts'
import { writeElng } from './writeElng.ts'
import { writeElst } from './writeElst.ts'
import { writeEmsg } from './writeEmsg.ts'
import { writeEnca } from './writeEnca.ts'
import { writeEncv } from './writeEncv.ts'
import { writeFree } from './writeFree.ts'
import { writeFrma } from './writeFrma.ts'
import { writeFtyp } from './writeFtyp.ts'
import { writeHdlr } from './writeHdlr.ts'
import { writeHev1 } from './writeHev1.ts'
import { writeHvc1 } from './writeHvc1.ts'
import { writeIden } from './writeIden.ts'
import { writeImda } from './writeImda.ts'
import { writeKind } from './writeKind.ts'
import { writeLabl } from './writeLabl.ts'
import { writeMdat } from './writeMdat.ts'
import { writeMdhd } from './writeMdhd.ts'
import { writeMehd } from './writeMehd.ts'
import { writeMeta } from './writeMeta.ts'
import { writeMfhd } from './writeMfhd.ts'
import { writeMfro } from './writeMfro.ts'
import { writeMp4a } from './writeMp4a.ts'
import { writeMvhd } from './writeMvhd.ts'
import { writePayl } from './writePayl.ts'
import { writePrft } from './writePrft.ts'
import { writePrsl } from './writePrsl.ts'
import { writePssh } from './writePssh.ts'
import { writeSchm } from './writeSchm.ts'
import { writeSdtp } from './writeSdtp.ts'
import { writeSidx } from './writeSidx.ts'
import { writeSkip } from './writeSkip.ts'
import { writeSmhd } from './writeSmhd.ts'
import { writeSsix } from './writeSsix.ts'
import { writeStco } from './writeStco.ts'
import { writeSthd } from './writeSthd.ts'
import { writeStsc } from './writeStsc.ts'
import { writeStsd } from './writeStsd.ts'
import { writeStss } from './writeStss.ts'
import { writeStsz } from './writeStsz.ts'
import { writeSttg } from './writeSttg.ts'
import { writeStts } from './writeStts.ts'
import { writeStyp } from './writeStyp.ts'
import { writeSubs } from './writeSubs.ts'
import { writeTenc } from './writeTenc.ts'
import { writeTfdt } from './writeTfdt.ts'
import { writeTfhd } from './writeTfhd.ts'
import { writeTfra } from './writeTfra.ts'
import { writeTkhd } from './writeTkhd.ts'
import { writeTrex } from './writeTrex.ts'
import { writeTrun } from './writeTrun.ts'
import { writeUrl } from './writeUrl.ts'
import { writeUrn } from './writeUrn.ts'
import { writeVlab } from './writeVlab.ts'
import { writeVmhd } from './writeVmhd.ts'
import { writeVttC } from './writeVttC.ts'
import { writeVtte } from './writeVtte.ts'

/**
 * Create a default writer configuration with all available writers pre-configured.
 *
 * @returns An `IsoBoxWriteViewConfig` with all available writers pre-configured
 *
 * @public
 */
export function defaultWriterConfig(): IsoBoxWriteViewConfig {
	return {
		writers: {
			ardi: writeArdi,
			avc1: writeAvc1,
			avc2: writeAvc2,
			avc3: writeAvc3,
			avc4: writeAvc4,
			ctts: writeCtts,
			dref: writeDref,
			elng: writeElng,
			elst: writeElst,
			emsg: writeEmsg,
			enca: writeEnca,
			encv: writeEncv,
			free: writeFree,
			frma: writeFrma,
			ftyp: writeFtyp,
			hdlr: writeHdlr,
			hev1: writeHev1,
			hvc1: writeHvc1,
			iden: writeIden,
			imda: writeImda,
			kind: writeKind,
			labl: writeLabl,
			mdat: writeMdat,
			mdhd: writeMdhd,
			mehd: writeMehd,
			meta: writeMeta,
			mfhd: writeMfhd,
			mfro: writeMfro,
			mp4a: writeMp4a,
			mvhd: writeMvhd,
			payl: writePayl,
			prft: writePrft,
			prsl: writePrsl,
			pssh: writePssh,
			schm: writeSchm,
			sdtp: writeSdtp,
			sidx: writeSidx,
			skip: writeSkip,
			smhd: writeSmhd,
			ssix: writeSsix,
			stco: writeStco,
			sthd: writeSthd,
			stsc: writeStsc,
			stsd: writeStsd,
			stss: writeStss,
			stsz: writeStsz,
			sttg: writeSttg,
			stts: writeStts,
			styp: writeStyp,
			subs: writeSubs,
			tenc: writeTenc,
			tfdt: writeTfdt,
			tfhd: writeTfhd,
			tfra: writeTfra,
			tkhd: writeTkhd,
			trex: writeTrex,
			trun: writeTrun,
			'url ': writeUrl,
			'urn ': writeUrn,
			vlab: writeVlab,
			vmhd: writeVmhd,
			vttC: writeVttC,
			vtte: writeVtte,
		},
	}
}
