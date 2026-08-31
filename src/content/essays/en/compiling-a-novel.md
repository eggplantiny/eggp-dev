---
title: "Compiling a Novel"
subtitle: "Before I let an AI write a single sentence, I built a pipeline"
date: 2026-08-31
description: "An experiment in giving a serialized novel a build pipeline: an all-green but lifeless first draft, a firewall that keeps secrets from the AI, and the things no machine can proofread."
seoTitle: "Compiling a Novel: An Experiment in AI-Assisted Archive Fiction"
seoDescription: "What happened when a serialized novel got a compiler, validators, and release locks — and where AI-assisted fiction still comes down to human judgment."
tags: ["AI", "writing", "fiction", "LLM", "compilers", "serialization"]
keywords: ["AI fiction", "AI-assisted writing", "LLM writing", "constraint-based creation", "archive novel", "30 Months"]
ogImageAlt: "Compiling a Novel essay cover image"
draft: false
---

> *This essay was originally written in Korean and translated into English with the help of AI. The novel it describes, [《30개월》 (30 Months)](/30months), is currently serialized in Korean only.*

# Compiling a Novel

## Before I let an AI write a single sentence, I built a pipeline

---

In [my last essay](/essays/en/superintelligence-in-my-hands), I wrote about building a DSL compiler with AI. The conclusion, roughly: AI compresses 80% of expertise, but the final judgment stays irreducibly human.

Now I'm serializing a novel. It's called *30 Months* — a story that follows the time after a certain disaster entirely through documents. Broadcast transcripts, official notices, saved bulletin-board threads, handwritten ledgers, and the occasional interview. There is no narrator. Nobody explains anything.

While writing it, I've been running a strange experiment. **Before writing the manuscript, I built a compiler.** A real one. It has intermediate representations, validators, hash-pinned approval locks, and a guard that runs before anything ships. I gave a novel a build pipeline.

This is a record of where that experiment failed, and where it succeeded in ways I didn't expect.

---

### The problem with a novel that has no narrator

I should explain the form first. What the reader reads is not a story but **an arrangement of records**. One record in the first installment, for example, is the transcript of an election-night broadcast: a candidate's sentence cuts off mid-word, there's the sound of a microphone being bumped, six seconds of silence, an off-mic voice asking for a chair, and the anchor moves on to the next district. That's all. Nobody tells you what happened.

Everything this form achieves comes from **the placement and absence of information**. The reader works through six shelters' messy daily ledgers laid side by side, and at some point starts doing arithmetic they were never asked to do. Then, in the installment's final record, an anonymous forum user performs that exact calculation — *"Put them side by side and something shows. That's the scarier part."* — and the reader watches their own inference happen inside the archive.

You cannot write this kind of novel on prose skill alone, because the constraints pile up by the dozen. What does the person who wrote this notice *not know* at this moment? How many appearances does this character have left? Will this ledger's numbers contradict the numbers that go public three installments later? And serialization is irreversible. Once a number is published, it becomes a law of physics for that world.

No human memory can hold thirty installments of constraints like these. An AI's memory holds them even worse. So I stopped relying on memory and turned them into data.

---

### Giving a novel a build pipeline

The structure looks like this. There are canonical world documents; each installment has a brief and a plan; every individual record gets compiled into an intermediate representation. And the AI never sees any of that directly — it receives **a single packet filtered through an allow-list**. The facts this record can observe, the knowledge ceiling of whoever wrote it, the characters permitted in the scene and their behavioral rules. Nothing else.

The core idea is simple. **Instead of saying "don't write this," make it unknowable.** If you instruct a language model "don't reveal X," X has just entered the model's attention. The most reliable way to keep a secret is to never hand it over. The facts only the author knows are structurally unable to reach the AI.

There was a moment this design earned its keep. One minor character must appear exactly once, nameless, and vanish forever — and a pre-release scan caught his name riding along in a packet's metadata label. A human would have missed it. That character's anonymity matters as much as any sentence in the book.

The canon documents follow one rule that has nothing to do with AI, and which I now think is simply good craft: **no personality adjectives in character sheets.** Instead of "diligent" or "cynical," you write down what this person looks at first in a room, what they do when they don't know, and how their emotions leak into observable behavior when the pressure rises. An adjective can't produce a sentence. A behavioral rule produces a scene.

---

### A first draft that followed every rule, and bored me

I have to tell you about the first draft. It passed every check. Zero canon violations, correct arrangement, every knowledge ceiling respected. And **it was lifeless.**

Tracing the cause, I found it wasn't a prose problem — it was plumbing. I had computed an emotional pressure value for every scene and then never delivered it to the AI. I required characters to be "mentioned" but never required them to *speak*, so one character existed as a single line of screen credit. And the constraint wording read as "write only these facts," so the AI produced summaries translated into dialogue — no background noise, no silence, no verbal tics.

I changed the wording. "Write only these facts" became "make no **claims** beyond these facts" — a boundary on assertions, not a whitelist of content. The texture of the world came back. The camera operator who had been a credit line became a voice leaking through a live-feed mishap, asking someone to *stash a cup of ramyeon in the van because tonight's going to run long*.

I didn't revise a single sentence, and the sentences got better. This is the most important thing the experiment taught me: **in AI-assisted fiction, prose quality is substantially an information-design problem, not a prompting problem.**

---

### What machines catch, what humans catch

None of which means the pipeline writes the novel. Some things need saying plainly.

That lifeless draft was all green. Validators catch violations; they do not catch deadness. A record that runs too long, a silence that's become a cliché, an installment that's flat from end to end — you only know by reading. And there are decisions. Whose voice should the sole interview carry? Should a closed building quietly return under a different use? Should an installment end on an institutional announcement, or on one person's private recording? The pipeline has no answer to these questions. It must not have one.

The division of labor settled here: **machines catch violations, humans make choices. The AI is not a free author but a constrained realizer.** And — strange as it sounds — the AI as constrained realizer wrote far better sentences than the AI as free author ever did. That constraints don't strangle creation but *aim* it: I understood this in my bones for the first time.

---

### Will this become the default?

Probably not. Let me be honest about that.

This methodology's preparation-to-writing cost runs about four to one. For an ordinary novel that follows a character's interior life, that weight would have strangled the work. The experiment holds because this novel happens to be **a story about records and controlled information**. It is no coincidence that a tool for writing a world made of bureaucratic arithmetic came to resemble bureaucratic arithmetic.

Still, a few principles transfer to any kind of creative work with AI, even if the full apparatus doesn't:

1. If the model must not say it, don't forbid it — make it unknowable.
2. Hand every machine-checkable constraint to the machine, and spend human judgment only on what requires reading.
3. Manage continuity as data, not memory. Serialization is irreversible.
4. Never trust a green light. The read-through cannot be automated.

---

In my last essay I wrote about the 80% AI compresses and the 20% that stays human. The ratio held for fiction too. What changed was the content of the 20%. Building a compiler, it was judgment about which abstraction is right. Writing this novel, it is judgment about **what not to write**.

The most important sentences in this novel are the unwritten ones. Six seconds nobody explains. A question that never gets a reply. A photograph that is mentioned and never attached. AI can produce sentences now — and so, paradoxically, the author's job has come into sharper focus: deciding where the silence goes.

Four months ago I compiled state machines. Now I'm compiling silence.

The serial is [here](/30months) — in Korean, for now.
