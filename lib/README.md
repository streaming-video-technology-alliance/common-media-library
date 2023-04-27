# common-media-library
A common library for media playback in JavaScript.

Looking at open source players like [hls.js](https://github.com/video-dev/hls.js/), [dash.js](https://github.com/Dash-Industry-Forum/dash.js/) and [shaka-player](https://github.com/shaka-project/shaka-player) there are common pieces of functionality that have been implemented independently, and sometimes copy and pasted, across the libraries. This is particularly true when looking at standards based features, like ID3 parsing, 608 parsing and CMCD. Since the functionality is shared in spirit but not implementation, they can fall out of sync where certain bugs are fixed in one player but not the others. The goal of this library is to create a single place where these utilities can be maintained and distributed.
