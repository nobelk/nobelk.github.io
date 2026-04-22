---
layout: post
title: "Hello, World"
date: 2026-04-21 09:00:00 -0400
description: "First post on Zero Downtime — what to expect from this blog and a small demonstration of the layout system."
tags: [meta]
categories: [systems]
---

Welcome to **Zero Downtime**. This is a placeholder post used to validate the
Phase 3 layout system: typography, post metadata, code highlighting, lists,
and the `<!--more-->` excerpt split.

<!--more-->

## What I'll write about

I work on systems that have to stay up — distributed databases, message
queues, deployment pipelines, the operational glue around all of it. Posts
here will mostly cover:

- **Failure analysis** — postmortems abstracted of names and blame.
- **Reliability patterns** — backpressure, idempotency, exactly-once
  illusions, and where their assumptions break.
- **Tooling** — small notes on instruments I find indispensable.

## A code sample, for testing

```python
def with_retry(fn, attempts=3, backoff=0.2):
    for i in range(attempts):
        try:
            return fn()
        except TransientError:
            if i == attempts - 1:
                raise
            time.sleep(backoff * (2 ** i))
```

A short inline `code` snippet for good measure.

## A blockquote

> Anything that can go wrong, will go wrong &mdash; at exactly the moment your
> on-call rotation hands off.

That's all for now.
