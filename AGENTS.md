⚠️ Mandatory: AI agents must read this file before writing or modifying any code.

# AGENTS.md

This file complements the workspace-level Ansiversa-workspace/AGENTS.md (source of truth). Read workspace first.

MANDATORY: After completing each task, update this repo’s AGENTS.md Task Log (newest-first) before marking the task done.

## Scope
- Mini-app repository for 'eduprompt' within Ansiversa.
- Follow the parent-app contract from workspace AGENTS; do not invent architecture.

## Phase Status
- Freeze phase active: no new features unless explicitly approved.
- Allowed: verification, bug fixes, cleanup, behavior locking, and documentation/process hardening.

## Architecture & Workflow Reminders
- Prefer consistency over speed; match existing naming, spacing, and patterns.
- Keep Astro/Alpine patterns aligned with ecosystem standards (one global store pattern per app, actions via astro:actions, SSR-first behavior).
- Do not refactor or change established patterns without explicit approval.
- If unclear, stop and ask Karthikeyan/Astra before proceeding.

## Where To Look First
- Start with src/, src/actions/, src/stores/, and local docs/ if present.
- Review this repo's existing AGENTS.md Task Log history before making changes.

## Task Log (Recent)
- Keep newest first; include date and short summary.
- 2026-03-25 Implemented EduPrompt V1: Astro DB EduPrompts schema + indexed ownership/status taxonomy, authenticated CRUD/archive/favorite actions, Alpine global store, /app workspace + /app/prompts/[id] detail flows, dashboard summary webhook + high-signal notification hooks, middleware route protection updates, and typecheck/build validation.
- 2026-03-25 Key decisions: manual prompt library only (no AI execution/sharing), archive-over-delete policy, SSR-first form actions with Alpine UI filtering, parent dashboard payload for appId=eduprompt, and notifications only for first prompt/first favorite/25 milestone.
- 2026-02-09 Added repo-level AGENTS.md enforcement contract (workspace reference + mandatory task-log update rule).
- 2026-02-09 Initialized repo AGENTS baseline for single-repo Codex/AI safety.
