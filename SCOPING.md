# Common Media Library Scope

## Overview

The purpose of the Common Media Library is to consolidate common pieces of functionality and interfaces relating to browser-based media playback that have been implemented independently across multiple open-source libraries leading to mismatched functionality and feature sets.

In our work across Hls.js, Dash.js and Shaka player, we have noticed common pieces of functionality that have been implemented independently, and sometimes copied and pasted, across the libraries. This is particularly true when looking at standards-based features, like ID3 parsing, 608 parsing and CMCD. Since the functionality is shared in spirit but not implementation, they can fall out of sync where certain bugs are fixed in one player but not the others. Having a common library creates a single place where these utilities can be maintained. It also creates a single place for standards groups to request and oversee feature implementation.


## Contributors

- Casey Occhialini - Author, Reviewer
- Dan Sparacio - Reviewer
- Ali Begen - Reviewer


## Objectives

Maintain a modern, modular, Javascript utility library for media playback. To achieve this the library will:
- Be written in TypeScript and modern build tools
- Distributed as standalone files that can be imported as needed.
- Provide documentation pertaining to the library's API and usage.


## Project Scope

The initial scope of the Common Media Library will address the following functionality:
- Providing SDKs for standards based media player features like:
  - Common Media Client Data (CMCD) encoding / decoding
  - Common Media Server Data (CMSD) encoding / decoding
  - ID3 tag parsing 
  - ISO BMFF parsing
  - CTA-608 / 708 parsing and rendering
  - VTT parsing and rendering
  - IMSC parsing and rendering
  - HLS manifest parser 
  - Dash manifest parser
- Providing a place to develop SDKs for new/upcoming standards like C2PA, MoQ, etc.

The initial scope of this project does not include:
- A working media player. The library should be used by developers to implement standards based features in their own players.


## Constraints

The library will be licensed under the Apache 2.0 license. References to other license notifications will be maintained in a `NOTICE.md` file when applicable.


## Deliverables

### Source Code

The source code for the library will be maintained in a public Github repository under the `streaming-video-technology-alliance` organization. Changes to the library are submitted as pull requests to the repository. All pull requests must be approved by a minimum of two SVTA approved code reviewers (SVTA member or subject matter expert).


### Documentation

The documentation for the library will be distributed via Github pages, deployed with every version release.


### Distribution

The library will be distributed as an NPM package in the `@svta` organization, `@svta/common-media-library`. Publishing permissions are restricted to SVTA members.
