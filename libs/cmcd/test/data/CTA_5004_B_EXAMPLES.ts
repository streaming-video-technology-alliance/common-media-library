/** Query-arg lines of CTA-5004-B section 8.1, request mode. */
export const EX_8_1_1 =
	'CMCD=bl%3D%282000%29%2Cbr%3D%283000%3Bv%29%2Ccid%3D%22content-id-123%22%2Cd%3D4000%2Cdl%3D1000%2Cmtp%3D%2815000%29%2Cnor%3D%28%22next-seg.mp4%22%29%2Cot%3Dv%2Crtp%3D12000%2Csf%3Dd%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Csta%3Dp%2Ctb%3D%286000%3Bv%29%2Cv%3D2'
export const EX_8_1_1_HEADERS = {
	'CMCD-Request': 'bl=(2000),dl=1000,mtp=(15000),nor=("next-seg.mp4"),sta=p',
	'CMCD-Object': 'br=(3000;v),d=4000,ot=v,tb=(6000;v)',
	'CMCD-Status': 'rtp=12000',
	'CMCD-Session': 'cid="content-id-123",sf=d,sid="session-id-123",st=v,v=2',
}
export const EX_8_1_2 =
	'CMCD=bl%3D%282000%29%2Cbr%3D%28320%29%2Ccid%3D%22content-id-123%22%2Cd%3D2000%2Cmtp%3D%2815000%29%2Cot%3Da%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Cv%3D2'
export const EX_8_1_3 = 'CMCD=cid%3D%22content-id-123%22%2Csid%3D%22session-id-123%22%2Cv%3D2'
export const EX_8_1_4: readonly string[] = [
	'CMCD=cid%3D%22content-id-123%22%2Cot%3Dm%2Csf%3Dd%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Csu%2Cv%3D2',
	'CMCD=bl%3D%280%29%2Cbr%3D%283000%3Bv%29%2Ccid%3D%22content-id-123%22%2Cmtp%3D%2815000%29%2Cnor%3D%28%22seg-1.m4v%22%20%22seg-2.m4v%22%29%2Cot%3Di%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Csta%3Ds%2Csu%2Cv%3D2',
	'CMCD=bl%3D%280%29%2Cbr%3D%283000%3Bv%29%2Ccid%3D%22content-id-123%22%2Cd%3D4000%2Cmtp%3D%2815000%29%2Cnor%3D%28%22seg-2.m4v%22%20%22seg-3.m4v%22%29%2Cot%3Dv%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Csta%3Ds%2Csu%2Cv%3D2',
	'CMCD=bl%3D%284000%29%2Cbr%3D%283000%3Bv%29%2Ccid%3D%22content-id-123%22%2Cd%3D4000%2Cmsd%3D200%2Cmtp%3D%2815000%29%2Cnor%3D%28%22seg-3.m4v%22%20%22seg-4.m4v%22%29%2Cot%3Dv%2Csid%3D%22session-id-123%22%2Cst%3Dv%2Csta%3Dp%2Cv%3D2',
]
export const EX_8_1_5: readonly string[] = [
	'CMCD=cid%3D%22content-id-123%22%2Cec%3D%28%22CODEC_NOT_SUPPORTED%22%29%2Csid%3D%22session-id-123%22%2Csta%3Dp%2Cv%3D2',
	'CMCD=cid%3D%22content-id-123%22%2Cec%3D%28%22DRM_NOT_SUPPORTED%22%20%22PLAYBACK_FAILED%22%29%2Csid%3D%22session-id-123%22%2Csta%3Df%2Cv%3D2',
]
export const EX_8_1_6: readonly string[] = [
	'CMCD=bl%3D%280%29%2Cbs%2Ccid%3D%22content-id-123%22%2Cot%3Dv%2Csid%3D%22session-id-123%22%2Csta%3Dr%2Cv%3D2',
	'CMCD=bl%3D%280%3Bv%202000%3Ba%29%2Cbs%2Ccid%3D%22content-id-123%22%2Cot%3Dv%2Csid%3D%22session-id-123%22%2Csta%3Dr%2Cv%3D2',
]
export const EX_8_1_7 = {
	primary: 'CMCD=cid%3D%22movie-123%22%2Cot%3Dv%2Csid%3D%22session-common-1%22%2Cv%3D2',
	ad: 'CMCD=cid%3D%22ad-555%22%2Cnr%2Cot%3Dv%2Csid%3D%22session-common-1%22%2Cv%3D2',
	primaryHidden: 'CMCD=cid%3D%22movie-123%22%2Cnr%2Cot%3Dv%2Csid%3D%22session-common-1%22%2Cv%3D2',
	adShown: 'CMCD=cid%3D%22ad-555%22%2Cot%3Dv%2Csid%3D%22session-common-1%22%2Cv%3D2',
}
/** 8.1.8 with `sn=129` replaced by the first sequence number of a fresh session. */
export const EX_8_1_8 =
	'CMCD=bg%2Cbl%3D%282100%3Bv%201800%3Ba%29%2Cbr%3D%283000%3Bv%20164%3Ba%29%2Cbs%2Cbsa%3D%283%3Bv%29%2Cbsd%3D%281200%3Bv%20100%3Ba%29%2Cbsda%3D%284150%3Bv%20300%3Ba%29%2Ccid%3D%22content-id-123%22%2Ccs%3D%22g48djn236sk2%22%2Cd%3D4000%2Cdfa%3D32%2Cdl%3D1000%2Cec%3D%28%222001%22%29%2Clb%3D%28500%3Bv%2032%3Ba%29%2Cltc%3D13500%2Cmsd%3D1700%2Cmtp%3D%2815000%3Bv%206000%3Ba%29%2Cnor%3D%28%22next-seg.mp4%22%29%2Cnr%2Cot%3Dv%2Cpb%3D%282000%3Bv%20164%3Ba%29%2Cpr%3D1.1%2Cpt%3D632782%2Crtp%3D12000%2Csf%3Dd%2Csid%3D%22session-id-123%22%2Csn%3D0%2Cst%3Dl%2Csta%3Dp%2Csu%2Ctb%3D%286000%3Bv%20350%3Ba%29%2Ctbl%3D%282000%3Bv%202000%3Ba%29%2Ctpb%3D%285000%3Bv%20164%3Ba%29%2Cv%3D2'

/** POST bodies of section 8.2, event mode. Document whitespace removed. */
export const EX_8_2_1 = 'e=t,ts=1764752400000,v=2'
export const EX_8_2_2: readonly string[] = [
	'bl=(0),cid="content-id-123",e=t,h="example.com",pt=0,sid="session-id-123",sn=1,sta=s,su,ts=1764752400000,v=2',
	'bl=(6000),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),msd=812,mtp=(87000;v 49000;a),pb=(4200;v 256;a),pt=29188,sf=d,sid="session-id-123",sn=2,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752430000,v=2',
	'bl=(3200),br=(4200;v 256;a),bs,bsd=(720;v),cid="content-id-123",e=t,ec=("MEDIA_ERR_NETWORK"),h="example.com",lb=(523;v 64;a),mtp=(89000;v 52000;a),pb=(4200;v 256;a),pt=59188,sf=d,sid="session-id-123",sn=3,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752460000,v=2',
	'bl=(6000),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),mtp=(81000;v 55000;a),pb=(4200;v 256;a),pt=89188,sf=d,sid="session-id-123",sn=4,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752490000,v=2',
	'bl=(0),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),mtp=(82000;v 55000;a),pb=(4200;v 256;a),pr=0,pt=111000,sf=d,sid="session-id-123",sn=5,st=v,sta=e,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752520000,v=2',
]
export const EX_8_2_3 =
	'cid="bbb",cmsdd="ZXRwPTEyNTAwO3J0dD0zNTttYj02MDAwO3JkPTIwMA==",cmsds="c2lkPSI5YTNiLTIxY2QiO2JyPTQ1MDA7ZD00MDAwO290PXY7c3Q9dg==",e=rr,nor=("video/segment-6.m4v"),ot=v,rc=200,sid="session1",ts=1763657019723,ttfb=180,ttlb=200,url="video/segment-5.m4v",v=2'
export const EX_8_2_4 =
	'cid="content-id-123",e=e,ec=("CODEC_NOT_SUPPORTED"),sid="session-id-123",ts=1764269150213,v=2'
export const EX_8_2_6 =
	'bl=(0),cid="content-id-123",e=ps,pt=30000,sid="session-id-123",sta=k,ts=1764269150529,v=2'
export const EX_8_2_7 = 'cid="ad-content-555",e=sk,sid="session-id-123",ts=1764269150076,v=2'
export const EX_8_2_8: readonly string[] = [
	'cid="movie-123",e=abs,nr,sid="session-id-123",ts=1764269150186,v=2',
	'cid="ad-001",e=as,sid="session-id-123",ts=1764269150934,v=2',
	'cid="ad-001",e=ae,nr,sid="session-id-123",ts=1764269170901,v=2',
	'cid="movie-123",e=abe,sid="session-id-123",ts=1764269170331,v=2',
]
