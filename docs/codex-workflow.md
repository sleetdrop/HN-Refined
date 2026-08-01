# Codex Workflow

This is a deliberately small first version of the HN Refined workflow. It is
for both the maintainer and Codex. Change it when repeated use reveals a real
problem; do not grow it in anticipation of every possible task.

## The Shape of Work

HN Refined work is a graph, not a fixed pipeline:

- An **initiative** is a source of exploration, such as reassessing the product
  after learning more about Hacker News.
- An **outcome** is one independently reviewable and committable result, such as
  Thread Focus or dark-theme color semantics.
- An **iteration** is feedback that helps the same outcome meet its acceptance
  criteria, such as an iPhone screenshot exposing overflow.

Keep iterations in the current Codex task. Start a new task when work becomes a
new outcome with its own behavior, files, verification surface, or commit. The
maintainer is not expected to predict that boundary: Codex should recognize it,
briefly explain why it is a separate branch, and offer to prepare a handoff.
Codex must not create a new task without the maintainer's confirmation.

When a split is confirmed, the handoff should contain only:

- why the outcome exists;
- accepted decisions and explicit non-goals;
- the starting commit and current working-tree state;
- affected surfaces and required verification;
- the unresolved question or next concrete action.

Use a short `docs/work/<outcome>.md` only when work really needs to cross a task
boundary before it is committed. Delete it when the outcome is absorbed into
the durable product docs and Git history. Do not summarize the whole chat.

## Starting and Continuing Tasks

For a new outcome, a short prompt is enough:

```text
继续 HN Refined。目标是：<一个可验收的结果>。
如果它长出独立分支，请主动提示并准备 handoff；不要擅自扩大范围。
```

For more exploration before implementation:

```text
先分析 <问题或材料> 对 HN Refined 的影响，不实施。
请把可能的独立 outcome 区分出来。
```

Continue using the current task for screenshots, simulator findings, and small
regressions caused by the same outcome. After a clean accepted commit, prefer a
new task for the next independent outcome.

Compaction is a recovery mechanism, not a project boundary. After compaction,
Codex should compare the current objective with Git status, the diff, and any
active handoff instead of trusting the conversation summary alone. If the same
task has compacted repeatedly and a clean outcome boundary exists, Codex should
offer a fresh-task handoff.

## Task Weight and Superpowers

Classify by uncertainty and risk, not by the number of requested lines:

| Weight   | Typical work                                                                               | Expected method                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Tiny     | Copy, isolated CSS value, obvious selector or documentation correction                     | Direct inspection, smallest change, focused check                                                     |
| Standard | Bounded feature or bug with known behavior                                                 | Short in-chat plan, targeted regression coverage, relevant Safari verification                        |
| Complex  | Ambiguous interaction, multi-state navigation, architecture, security, or release decision | Explicit design discussion; use stronger review and formal planning only when it improves the outcome |

Superpowers remains available, but it is not the default ceremony for every
change. Do not create brainstorming, design, or implementation-plan documents
for Tiny work. Standard work normally needs only a concise plan in the task.
Use the fuller Superpowers workflow for genuinely Complex work or when the
maintainer explicitly requests it. Systematic debugging and verification remain
useful techniques at every size, scaled to the risk.

Historical files under `docs/superpowers/` explain earlier decisions; they are
not startup context and should not be copied forward mechanically.

## Model and Agent Routing

The project defaults to `gpt-5.6-terra` at medium reasoning. This is the main
implementation model for ordinary HN Refined work.

- Use Sol (`gpt-5.6`) for ambiguous product interaction, architectural choices,
  difficult state reasoning, or a final review where a mistake would be costly.
- Use Terra for normal implementation, debugging, tests, documentation, and
  Safari verification.
- Use Luna for narrow read-heavy exploration or repetitive evidence gathering.

The project provides three optional custom agents:

- `hn_explorer`: read-only code and documentation mapping with Luna.
- `safari_verifier`: Terra-based runtime and visual verification; it reports
  evidence and does not edit product code.
- `hn_reviewer`: read-only Sol review for complex or release-sensitive changes.

Subagents cost additional tokens. Do not use them for Tiny work or merely to
imitate a team. Use them when they keep browser logs, repository exploration, or
review noise out of the main decision task. Prefer one bounded agent at a time
unless two investigations are genuinely independent.

## Verification Ladder

Verification follows the risk and the changed surface:

1. During iteration, run the smallest relevant test or lint target.
2. For visual work, reproduce the relevant state before editing and self-check
   it afterward in iOS Simulator. Verify state transitions, not only the initial
   screenshot: focus, keyboard, resize controls, rotation, Back/Forward, or
   collapse when relevant.
3. Check macOS Safari when desktop behavior or extension lifecycle is affected.
4. Run `make format && make check` once before an ordinary commit.
5. For Safari runtime behavior, refresh the installed extension with
   `make safari-reinstall` and run `make safari-doctor` when local signing is
   available. Report signing limitations separately from source correctness.
6. Ask for physical-device confirmation only when simulator evidence cannot
   cover momentum scrolling, touch ergonomics, extension permissions, or final
   visual burn-in.

Do not claim a visual or Safari behavior is fixed from code inspection alone.
Do not run the complete simulator matrix after every micro-adjustment; choose
the pages and states implicated by the change, then use the full quality gate at
the commit boundary.

## Closing an Outcome

Before committing, Codex should state the acceptance evidence, review the diff
for unrelated changes, update only the documentation whose durable truth has
changed, and run the appropriate final gate. Do not touch privacy, App Store,
release, or broad status documents when a change has no effect on them.

After an accepted commit, update `docs/current-state.md` only if release
position, active work, blockers, or the next-task handoff changed. Git records
the implementation; documentation records stable intent and current direction.

## References

- [Projects](https://learn.chatgpt.com/docs/projects): keep related work in one
  project and use separate tasks for distinct outcomes.
- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents):
  custom agents, model routing, and keeping noisy supporting work out of the
  main task.
- [Models](https://learn.chatgpt.com/docs/models): current Sol, Terra, Luna, and
  reasoning-effort guidance.
- [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md):
  durable project instructions and instruction discovery.
- [Harness engineering](https://openai.com/index/harness-engineering/): why a
  compact index and discoverable references work better than one giant context
  file.
