# App Spec: eduprompt

## 1) App Overview
- **App Name:** EduPrompt
- **Category:** Education / Prompt Library
- **Version:** V1
- **App Type:** DB-backed
- **Purpose:** Let an authenticated user maintain a personal library of teaching prompts with filtering, favorites, and archive controls.
- **Primary User:** A signed-in educator or prompt curator managing their own prompt set.

## 2) User Stories
- As a user, I want to create prompt records with subject, level, and category tags, so that I can organize teaching materials.
- As a user, I want to favorite and archive prompts, so that I can separate active, high-value, and historical items.
- As a user, I want to open a prompt detail page and edit it, so that I can maintain the prompt library over time.

## 3) Core Workflow
1. User signs in and opens `/app`.
2. User creates a prompt from the workspace drawer.
3. App stores the prompt in the user-scoped database and shows it in the filtered list.
4. User favorites, archives, or opens `/app/prompts/:id` to edit the prompt.
5. User returns to the workspace and filters prompts by tab, search, subject, level, or category.

## 4) Functional Behavior
- Prompt records are stored per authenticated user in the app database.
- The app supports create, update, favorite, archive, restore, detail viewing, and multi-filter list browsing; hard delete is not part of V1.
- `/app` is protected and redirects to the parent login flow when unauthenticated.
- Invalid, missing, or non-owned prompt detail routes resolve safely back to the workspace instead of returning `500`.

## 5) Data & Storage
- **Storage type:** Astro DB on the app’s isolated Turso database
- **Main entities:** Edu prompts
- **Persistence expectations:** User-owned prompts persist across refresh and new sessions.
- **User model:** Multi-user shared infrastructure with per-user isolation

## 6) Special Logic (Optional)
- This is a manual prompt library; prompt execution, AI generation, and sharing are not implemented in V1.
- Workspace tabs segment overview, active prompts, favorites, and archived prompts over the same persisted dataset.

## 7) Edge Cases & Error Handling
- Invalid IDs/routes: Invalid prompt detail routes redirect safely back to `/app`.
- Empty input: Invalid create or update payloads should be rejected cleanly.
- Unauthorized access: `/app` redirects to the parent login flow.
- Missing records: Missing or non-owned prompts are not exposed and resolve safely.
- Invalid payload/state: Action failures should not crash the workspace or detail route.

## 8) Tester Verification Guide
### Core flow tests
- [ ] Create a prompt, favorite it, and confirm it appears in the favorites tab.
- [ ] Open the prompt detail page, edit it, archive it, restore it, and confirm each state change persists.

### Safety tests
- [ ] Refresh the workspace after edits and confirm the list reflects persisted DB state.
- [ ] Visit invalid or missing prompt detail routes and confirm safe fallback to the workspace.
- [ ] Attempt direct detail access as another user and confirm cross-user access is blocked.

### Negative tests
- [ ] Confirm there is no AI execution or prompt-running flow in V1.
- [ ] Confirm the app does not return `500` for invalid or missing detail routes.

## 9) Out of Scope (V1)
- AI prompt execution or generation
- Public sharing or collaboration
- Hard delete of stored prompt records

## 10) Freeze Notes
- V1 release freeze: this document reflects the verified authenticated prompt-library workflow.
- Freeze Level 1 verification confirmed create, favorite, detail open, edit, archive/restore, refresh persistence, invalid-route safety, and cross-user protection.
- During freeze, only verification fixes and cleanup are allowed; no undocumented feature expansion.
