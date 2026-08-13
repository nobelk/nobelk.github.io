---
title: "Agentic Engineering: Spec-Driven Development"
date: 2026-04-23 09:00:00 -0400
series: "Agentic Engineering"
series_order: 2
description: "Spec-driven development with Claude Code — project constitutions, feature loops, validation, replanning, and agent-agnostic workflows."
image: /assets/img/sdd_workflow.png
tags: [spec-driven-development, coding-agents, ai, claude-code, workflow]
categories: [practices]
---

A coding agent can produce a remarkable amount of software before anyone has
agreed on what the software is for. That speed is exhilarating during the
first afternoon and expensive during the third month, when an architectural
decision survives only in an old chat, a validation rule has become folklore,
and two apparently sensible features no longer fit together.

Spec-driven development, or SDD, is my way of slowing down the decisions while
allowing the implementation to remain fast. It creates a versioned contract
between developers and coding agents: the specification records the *what* and
the *why*; the implementation supplies the *how*. The method is adapted from
DeepLearning.AI's short course on the subject and its
[course materials](https://github.com/https-deeplearning-ai/sc-spec-driven-development-files),
then altered by using it on real projects.

<!--more-->

The point is not to turn every feature into a ceremony. If a change fits in one
small prompt and one easily reviewed diff, SDD is overhead. It earns its keep
when work spans sessions, contributors, subsystems, or consequential trade-offs
that should outlive the conversation in which they were made.

## The project needs a memory

Chat history is a poor system of record. It may be truncated, unavailable to
another developer, or full of obsolete decisions that remain linguistically
plausible. A repository, by contrast, already has versioning, review, blame,
and a place in the build. SDD uses that durable medium as the agent's memory.

My workflow has two layers: a one-time project foundation and a repeating
feature loop.

![Spec-Driven Development workflow: Constitution followed by the Specify → Implement → Validate → Replan feature loop](/assets/img/sdd_workflow.png)

The foundation is a small directory of documents I call the project
Constitution. The name is grander than the files:

```text
specs/
├── mission.md       # audience, scope, principles, and non-goals
├── tech-stack.md    # architecture, tools, and technical constraints
└── roadmap.md       # ordered phases and intended outcomes
```

![Constitution components: mission.md, tech-stack.md, and roadmap.md in a specs/ directory](/assets/img/sdd_constitution.png){: loading="lazy"}

These files answer different questions. `mission.md` explains why the product
should exist and for whom. `tech-stack.md` records choices that generated code
must respect: supported runtimes, deployment target, data model, test tools,
security boundaries. `roadmap.md` says what should be attempted, and in what
order. Keeping the questions separate makes contradictions easier to see. A
roadmap item that violates a non-goal, or a proposed package that conflicts
with a deployment constraint, has nowhere to hide.

For a new project, I assemble the available requirements, design notes, and
organizational constraints, then ask the agent to draft these documents and
identify what it cannot infer. For an existing project, I add the codebase,
issue tracker, and current documentation to the evidence. The agent can recover
framework versions and recurring patterns from code; it cannot recover an
unstated product intention. Questions are part of the work, not evidence that
the prompt failed.

A useful initial request is deliberately modest:

```text
Read the repository and draft specs/mission.md, specs/tech-stack.md,
and specs/roadmap.md. Cite the source files for claims you infer from
the code. List unresolved product or architecture decisions before
writing assumptions into the documents.
```

The first draft is an interview aid, not a constitution handed down by the
model. I review all three files together, correct false inferences, and make
trade-offs explicit. Then I commit them. From that point on, the repository
contains a reviewable answer to a question that chat tools otherwise answer
poorly: *What did we decide, and when?*

## One feature, three documents

Each roadmap feature gets a branch and a small specification of its own:

```text
specs/feature-XX/
├── plan.md          # task groups, dependencies, and sequence
├── requirements.md  # behavior, constraints, decisions, and exclusions
└── validation.md    # observable evidence that the work is complete
```

The division is practical. Requirements say what must be true. The plan orders
the work without pretending that order is itself a product requirement.
Validation says what evidence will justify a merge. When all three concerns
live in one long document, an implementation detail can quietly masquerade as
a requirement, and a vague aspiration can masquerade as a test.

I begin the feature in a clean agent context. This is not ritual purification;
it is a test of the documents. If the agent cannot reconstruct the intended
work from the repository, the specification is incomplete. An old conversation
should not be a hidden dependency of a new branch.

The specification interview stays at the level where human judgment is most
valuable: user behavior, risk, architecture, privacy, performance budgets, and
explicit non-goals. I avoid choosing variable names or prescribing a class
layout unless the choice has consequences outside the implementation. An agent
can elaborate a design. It should not invent the business decision the design
is meant to serve.

Before implementation, I look for three common defects:

- a requirement with no validation criterion;
- a validation item with no corresponding requirement;
- a plan step that introduces scope neither document mentions.

That triangular review is more valuable than polishing the wording. It catches
the moment when “support authentication” has no threat model, “fast enough” has
no workload, or “migration” means only that the new schema exists.

## Implementation in reviewable increments

Once the feature spec is committed, implementation can move quickly. The
agent reads the Constitution and the feature directory, works through the plan,
and runs the checks named in `validation.md`. The useful unit of progress is a
reviewable task group, not the largest diff the model can produce before its
context fills.

Step size should follow risk. A small presentation feature may be implemented
in one pass. Authentication, database migration, concurrency, and safety logic
deserve smaller increments because mistakes in an early assumption compound.
The rule is not “agents must work slowly.” It is “humans must remain able to
understand the change.” Generated code creates a new form of cognitive debt:
the repository changes faster than its maintainers' mental model. Small diffs
are the interest payment.

During implementation, I review architecture and behavior before style. Does
the feature cross the intended boundaries? Does it preserve the data model?
Are failure modes observable? Can the migration be reversed? Linters can
settle whitespace and many naming disputes; they cannot tell me that a retry
will duplicate a payment.

When a defect exposes ambiguity in the spec, I update both code and spec on the
same branch. Otherwise the implementation becomes correct while the project's
memory remains wrong, and the next agent faithfully reintroduces the mistake.

## Validation is evidence, not self-assessment

An agent saying “the feature is complete” is a progress report. Completion
requires evidence. Depending on the work, `validation.md` may demand unit and
integration tests, a migration rehearsal, a benchmark under a named workload,
screenshots, an accessibility check, or an operator runbook. The list should be
written before the code because a scorecard invented afterward has a way of
describing precisely what the implementation already does.

My final review asks:

- Does the behavior match the requirement, including failure paths?
- Did the implementation preserve the Constitution's boundaries?
- Are tests exercising the important risk rather than merely the convenient
  branches?
- Have documentation and specifications changed with the code?
- Can another developer understand the diff without the chat transcript?

I still run the application and use the debugger when the feature warrants it.
Agentic development does not repeal the distinction between a test suite and a
working system. It only makes it easier to arrive at both with a traceable
record of intent.

## Replanning closes the loop

The easiest mistake after a merge is to start the next roadmap item as if the
project learned nothing. In practice, every substantial feature reveals
something: a library becomes standard, a boundary moves, a performance budget
turns out to be unrealistic, or a stakeholder changes the product's reach.

The replanning step records those discoveries. I update the Constitution when
a decision is project-wide, reconsider the roadmap's order, and add new work
only when its scope is understood. Small corrections can travel with the
feature that exposed them; a large architectural change deserves a branch and
review of its own. The important property is temporal: Git should reveal which
version of the project contract produced which implementation.

Repeated pieces of the workflow can become agent skills or scripts. A feature
specification skill might locate the next roadmap item, interview the developer,
and create the three-file directory. A validation skill might update the
changelog, run formatting and tests, inspect public-API changes, and prepare a
commit summary. Automation is useful when it preserves judgment rather than
concealing it. A skill can remember to run the migration test; it cannot decide
whether the migration's loss budget is acceptable.

## Greenfield and brownfield work

The same loop works in an existing codebase, with one important change: the
first Constitution is a hypothesis to be tested against both code and people.
The agent can infer the apparent architecture, but legacy systems often contain
accidents that look like policy. A dependency used in forty files may be a
standard, or it may be the technical debt everyone wants removed.

For brownfield work, I ask the agent to distinguish observation from decision:

```text
Build the draft Constitution from README files, architecture documents,
the dependency manifests, representative modules, tests, and open work.
Label each statement as documented, inferred, or unresolved. Do not turn
an implementation pattern into a project rule without asking.
```

That labeling prevents the most dangerous kind of reverse engineering: giving
historical inconsistency the authority of a design principle. Once the draft
has been reviewed by the people who know why the odd parts exist, the standard
feature loop applies.

## A specification should remain alive

SDD works because it treats prose as part of the engineering system. The files
are versioned, reviewed, and corrected alongside code; they are neither a
ceremonial preface nor an archaeological record written after release. They
make context portable between sessions and agents, and they give a human
reviewer something more durable than a confident explanation in a chat window.

The method also has a limit. A weak specification does not become strong
because an agent follows it precisely. If the team omits the failure mode, the
privacy constraint, or the operating budget, generation merely reaches the
wrong answer faster. The human role therefore moves upward, but it does not
disappear: decide what matters, make the trade-offs visible, and demand
evidence that the result satisfies them.

Start with one feature. Write down its requirements and exclusions, decide in
advance what would prove it complete, and begin the implementation in a clean
context. If the agent can proceed without borrowing intent from yesterday's
conversation, the project has acquired something more useful than a longer
prompt. It has acquired a memory.
