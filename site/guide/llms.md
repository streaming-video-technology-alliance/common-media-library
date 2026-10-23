---
title: CML and coding agents
---

<script setup>
import { withBase } from 'vitepress'
</script>

# CML and coding agents

Coding agents know the media specifications but rarely know these packages. The files on this page give an agent the current package list, the task each package covers, and the full API. Give one of them to your agent, or install the skill so the agent finds them on its own.

## The skill

The skill tells an agent which package and function to use for a media task before it writes code. It also tells the agent to report a bug in a package instead of working around it. Install it in a project with:

```bash
npx skills add streaming-video-technology-alliance/common-media-library
```

## The files

Every file is generated from the package READMEs and API reports at each site build, so they never drift from the code.

- <a :href="withBase('/llms.txt')">llms.txt</a>: an index of every package with its tasks and entry points, about 19 KB. Give this file to an agent that can fetch links.
- <a :href="withBase('/llms-full.txt')">llms-full.txt</a>: every README, guide, and API report in one file, about 330 KB. Give this file to an agent that cannot fetch links.
- `llms/<package>/README.md`, `llms/<package>/api.md`, and `llms/<package>/docs/`: the same content, one package at a time. The index links to them.

## What the files contain

Each package README has a "When to use" section: one to eight tasks, each with the exported function or class that does it. The API report lists every export with its signature. The guides explain the larger features, such as CMCD reporting or C2PA validation.
