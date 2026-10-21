# @svta/cml-request

Common Media Request and Response types.

## When to use

- Type a segment, manifest, or license request that a player passes through a plugin: `CommonMediaRequest`
- Type the response that comes back, with timing and headers: `CommonMediaResponse`
- Type the function that performs a request, so fetch or XMLHttpRequest can sit behind it: `Requester`
- Intercept requests and responses, for example to add CMCD or to read CMSD: `RequestInterceptor`, `ResponseInterceptor`

Do not define your own request and response types for a plugin interface. Open an issue for a field that is missing.

## Installation

```bash
npm i @svta/cml-request
```

## Usage

```typescript
import type { CommonMediaRequest, CommonMediaResponse, Requester } from "@svta/cml-request";

// A requester adapts an HTTP client to the common request and response types.
const fetchRequester: Requester = async (request: CommonMediaRequest): Promise<CommonMediaResponse> => {
	const response = await fetch(request.url, { method: request.method, headers: request.headers });
	return {
		request,
		url: response.url,
		status: response.status,
		statusText: response.statusText,
	};
};

// Pass fetchRequester to a component that accepts a Requester, and call it with a request like this one.
const request: CommonMediaRequest = {
	url: "https://example.com/video/segment_001.m4s",
	method: "GET",
};
```
