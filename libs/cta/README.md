# @svta/cml-cta

Common functionality for CTA standards, including CMCD, CMSD, and CTA-608/CEA-608. Do not use this utility package directly. Use `@svta/cml-cmcd`, `@svta/cml-cmsd`, or `@svta/cml-608`.

## When to use

- Share the object type, stream type, and streaming format values between CMCD and CMSD: `CmObjectType`, `CmStreamType`, `CmStreamingFormat`
- Tell a token field from a string field by its key, and check a value: `isTokenField`, `isValid`

Do not import this package into a player directly. Use `@svta/cml-cmcd`, `@svta/cml-cmsd`, or `@svta/cml-608`, which depend on this package.

## Installation

```bash
npm i @svta/cml-cta
```

## Usage

No direct usage. See the packages listed above.
