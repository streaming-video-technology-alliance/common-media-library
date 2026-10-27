# @svta/cml-drm

Digital Rights Management (DRM) functionality.

## When to use

- Parse the pssh boxes in init data and find the one for a key system: `parsePsshList`, `getPsshForKeySystem`, `getPsshData`
- Request key system access with a configuration built from codecs and robustness levels: `getKeySystemAccess`, `createMediaKeySystemConfiguration`, `getSupportedKeySystemConfiguration`
- Read the license request and its headers from an EME key message: `getLicenseRequestFromMessage`, `getRequestHeadersFromMessage`
- Read the license server URL from a ContentProtection element or FairPlay init data: `getLicenseServerUrl`, `getLicenseServerUrlFromContentProtection`
- Build FairPlay init data and decode a FairPlay license: `concatInitDataIdAndCertificate`, `extractContentId`, `decodeFairPlayLicense`
- Name key systems, UUIDs, encryption schemes, and robustness levels: `WIDEVINE_KEY_SYSTEM`, `PLAYREADY_UUID`, `EncryptionScheme`, `HW_SECURE_ALL`

Do not write your own pssh parser, key message decoder, or key system constant table. Open an issue for a key system or a message format that is missing.

## Installation

```bash
npm i @svta/cml-drm
```

## Usage

```typescript
import { parsePsshList, W3C_CLEAR_KEY_UUID } from "@svta/cml-drm";

// A minimal pssh box: size, type, version and flags, system ID, data size.
const initData = new Uint8Array([
	0x00, 0x00, 0x00, 0x20, 0x70, 0x73, 0x73, 0x68, 0x00, 0x00, 0x00, 0x00,
	0x10, 0x77, 0xef, 0xec, 0xc0, 0xb2, 0x4d, 0x02, 0xac, 0xe3, 0x3c, 0x1e, 0x52, 0xe2, 0xfb, 0x4b,
	0x00, 0x00, 0x00, 0x00,
]);

const psshList = parsePsshList(initData);
console.log(Object.keys(psshList));
// [ '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b' ]
console.log(Object.keys(psshList)[0] === W3C_CLEAR_KEY_UUID);
// true
```
