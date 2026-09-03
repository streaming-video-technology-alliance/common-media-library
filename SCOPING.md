# Common Media Library Scope

## Overview

The Common Media Library consolidates common functionality and interfaces for browser-based media playback. Multiple open-source libraries implemented these pieces independently. The result was mismatched functionality and feature sets.

In our work on Hls.js, Dash.js, and Shaka player, we noticed common functionality implemented independently in each library. Some of this functionality was copied and pasted between the libraries. This duplication is especially common for standards-based features, such as ID3 parsing, 608 parsing, and CMCD. The libraries share the intent of these features but not the code. A bug fixed in one player can remain in the others. A common library creates one place to maintain these utilities. It also creates one place for standards groups to request and oversee feature implementation.


## Contributors

- Casey Occhialini - Author, Reviewer
- Dan Sparacio - Reviewer
- Ali Begen - Reviewer


## Objectives

Maintain a modern, modular JavaScript utility library for media playback. To achieve this goal, the library will:
- Be written in TypeScript with modern build tools
- Be distributed as standalone files that can be imported as needed
- Provide documentation for the library's API and usage


## Project Scope

The initial scope of the Common Media Library will cover the following functionality:
- Software development kits (SDKs) for standards-based media player features, such as:
  - Common Media Client Data (CMCD) encoding / decoding
  - Common Media Server Data (CMSD) encoding / decoding
  - ID3 tag parsing 
  - ISO BMFF parsing
  - CTA-608 / 708 parsing and rendering
  - VTT parsing and rendering
  - IMSC parsing and rendering
  - HLS manifest parser 
  - Dash manifest parser
- A place to develop SDKs for new and upcoming standards, such as C2PA and MoQ

The initial scope of this project does not include:
- A working media player. Developers should use the library to implement standards-based features in their own players.


## Constraints

The library will use the Apache 2.0 license. When applicable, a `NOTICE.md` file will list the notices of other licenses.


## Deliverables

### Source Code

The source code will be maintained in a public GitHub repository under the `streaming-video-technology-alliance` organization. Changes are submitted as pull requests to the repository. Every pull request needs approval from at least two code reviewers approved by the Streaming Video Technology Alliance (SVTA). A reviewer is an SVTA member or a subject matter expert.


### Documentation

The documentation will be published on GitHub Pages with every version release.


### Distribution

The library will be distributed as npm packages in the `@svta` organization, one per library, named `@svta/cml-<name>`. Only SVTA members can publish.
