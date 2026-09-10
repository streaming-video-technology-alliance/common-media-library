/** Raw key lines of CTA-5004-B section 8.1, request mode. */
export const EX_8_1_1 = 'bl=(2000),br=(3000;v),cid="content-id-123",d=4000,dl=1000,mtp=(15000),nor=("next-seg.mp4"),ot=v,rtp=12000,sf=d,sid="session-id-123",st=v,sta=p,tb=(6000;v),v=2'
export const EX_8_1_1_HEADERS = {
	'CMCD-Request': 'bl=(2000),dl=1000,mtp=(15000),nor=("next-seg.mp4"),sta=p',
	'CMCD-Object': 'br=(3000;v),d=4000,ot=v,tb=(6000;v)',
	'CMCD-Status': 'rtp=12000',
	'CMCD-Session': 'cid="content-id-123",sf=d,sid="session-id-123",st=v,v=2',
}
export const EX_8_1_2 = 'bl=(2000),br=(320),cid="content-id-123",d=2000,mtp=(15000),ot=a,sid="session-id-123",st=v,v=2'
export const EX_8_1_3 = 'cid="content-id-123",sid="session-id-123",v=2'
export const EX_8_1_4: readonly string[] = [
	'cid="content-id-123",ot=m,sf=d,sid="session-id-123",st=v,su,v=2',
	'bl=(0),br=(3000;v),cid="content-id-123",mtp=(15000),nor=("seg-1.m4v" "seg-2.m4v"),ot=i,sid="session-id-123",st=v,sta=s,su,v=2',
	'bl=(0),br=(3000;v),cid="content-id-123",d=4000,mtp=(15000),nor=("seg-2.m4v" "seg-3.m4v"),ot=v,sid="session-id-123",st=v,sta=s,su,v=2',
	'bl=(4000),br=(3000;v),cid="content-id-123",d=4000,msd=200,mtp=(15000),nor=("seg-3.m4v" "seg-4.m4v"),ot=v,sid="session-id-123",st=v,sta=p,v=2',
]
export const EX_8_1_5: readonly string[] = [
	'cid="content-id-123",ec=("CODEC_NOT_SUPPORTED"),sid="session-id-123",sta=p,v=2',
	'cid="content-id-123",ec=("DRM_NOT_SUPPORTED" "PLAYBACK_FAILED"),sid="session-id-123",sta=f,v=2',
]
export const EX_8_1_6: readonly string[] = [
	'bl=(0),bs,cid="content-id-123",ot=v,sid="session-id-123",sta=r,v=2',
	'bl=(0;v 2000;a),bs,cid="content-id-123",ot=v,sid="session-id-123",sta=r,v=2',
]
export const EX_8_1_7 = {
	primary: 'cid="movie-123",ot=v,sid="session-common-1",v=2',
	ad: 'cid="ad-555",nr,ot=v,sid="session-common-1",v=2',
	primaryHidden: 'cid="movie-123",nr,ot=v,sid="session-common-1",v=2',
	adShown: 'cid="ad-555",ot=v,sid="session-common-1",v=2',
}
/** 8.1.8 with `sn=129` replaced by the first sequence number of a fresh session. */
export const EX_8_1_8 = 'bg,bl=(2100;v 1800;a),br=(3000;v 164;a),bs,bsa=(3;v),bsd=(1200;v 100;a),bsda=(4150;v 300;a),cid="content-id-123",cs="g48djn236sk2",d=4000,dfa=32,dl=1000,ec=("2001"),lb=(500;v 32;a),ltc=13500,msd=1700,mtp=(15000;v 6000;a),nor=("next-seg.mp4"),nr,ot=v,pb=(2000;v 164;a),pr=1.1,pt=632782,rtp=12000,sf=d,sid="session-id-123",sn=0,st=l,sta=p,su,tb=(6000;v 350;a),tbl=(2000;v 2000;a),tpb=(5000;v 164;a),v=2'

/** POST bodies of section 8.2, event mode. Document whitespace removed. */
export const EX_8_2_1 = 'e=t,ts=1764752400000,v=2'
export const EX_8_2_2: readonly string[] = [
	'bl=(0),cid="content-id-123",e=t,h="example.com",pt=0,sid="session-id-123",sn=1,sta=s,su,ts=1764752400000,v=2',
	'bl=(6000),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),msd=812,mtp=(87000;v 49000;a),pb=(4200;v 256;a),pt=29188,sf=d,sid="session-id-123",sn=2,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752430000,v=2',
	'bl=(3200),br=(4200;v 256;a),bs,bsd=(720;v),cid="content-id-123",e=t,ec=("MEDIA_ERR_NETWORK"),h="example.com",lb=(523;v 64;a),mtp=(89000;v 52000;a),pb=(4200;v 256;a),pt=59188,sf=d,sid="session-id-123",sn=3,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752460000,v=2',
	'bl=(6000),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),mtp=(81000;v 55000;a),pb=(4200;v 256;a),pt=89188,sf=d,sid="session-id-123",sn=4,st=v,sta=p,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752490000,v=2',
	'bl=(0),br=(4200;v 256;a),cid="content-id-123",e=t,h="example.com",lb=(523;v 64;a),mtp=(82000;v 55000;a),pb=(4200;v 256;a),pr=0,pt=111000,sf=d,sid="session-id-123",sn=5,st=v,sta=e,tb=(4200;v 256;a),tpb=(4200;v 256;a),ts=1764752520000,v=2',
]
export const EX_8_2_3 = 'cid="bbb",cmsdd="ZXRwPTEyNTAwO3J0dD0zNTttYj02MDAwO3JkPTIwMA==",cmsds="c2lkPSI5YTNiLTIxY2QiO2JyPTQ1MDA7ZD00MDAwO290PXY7c3Q9dg==",e=rr,nor=("video/segment-6.m4v"),ot=v,rc=200,sid="session1",ts=1763657019723,ttfb=180,ttlb=200,url="video/segment-5.m4v",v=2'
export const EX_8_2_4 = 'cid="content-id-123",e=e,ec=("CODEC_NOT_SUPPORTED"),sid="session-id-123",ts=1764269150213,v=2'
/** 8.2.5. The first line carries `bs`, which the example omits. See the derived test for the reason. */
export const EX_8_2_5: readonly string[] = [
	'bs,cid="content-id-123",e=ps,sid="session-id-123",sta=r,ts=1764269150889,v=2',
	'bs,bsd=(1500),cid="content-id-123",e=ps,sid="session-id-123",sta=p,ts=1764269152389,v=2',
]
export const EX_8_2_6 = 'bl=(0),cid="content-id-123",e=ps,pt=30000,sid="session-id-123",sta=k,ts=1764269150529,v=2'
export const EX_8_2_7 = 'cid="ad-content-555",e=sk,sid="session-id-123",ts=1764269150076,v=2'
export const EX_8_2_8: readonly string[] = [
	'cid="movie-123",e=abs,nr,sid="session-id-123",ts=1764269150186,v=2',
	'cid="ad-001",e=as,sid="session-id-123",ts=1764269150934,v=2',
	'cid="ad-001",e=ae,nr,sid="session-id-123",ts=1764269170901,v=2',
	'cid="movie-123",e=abe,sid="session-id-123",ts=1764269170331,v=2',
]
