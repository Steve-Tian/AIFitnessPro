# AIFitnessPro Android MVP Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each child plan task-by-task. Steps in child plans use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the Android migration into implementation plans small enough to execute and verify.

**Architecture:** AIFitnessPro Android will be a native Kotlin + Jetpack Compose app with local-first workout data, an independent backend API, structured database tables, and domestic Android compliance built into the shell from day one. This roadmap intentionally avoids one giant plan because Android, backend, content, and store release are independent subsystems.

**Tech Stack:** Kotlin, Jetpack Compose, Room, DataStore, Navigation Compose, Retrofit/Ktor, WorkManager, NestJS, PostgreSQL/MySQL, object storage/CDN.

---

## Plan Sequence

### Plan 1: Android Foundation and Compliance Shell

**Purpose:** Create the native Android app skeleton, first-launch privacy consent, four-tab navigation, local settings, and placeholder pages.

**Depends on:** Product design spec.

**Unblocks:** All Android feature work.

**Output:** A runnable Android app shell with consent gating and navigation.

### Plan 2: Backend API and Database Foundation

**Purpose:** Create the independent backend, database schema, auth boundaries, user/profile APIs, and content table foundations.

**Depends on:** Data model in the design spec.

**Unblocks:** Auth, onboarding, plan generation, sync, content operations.

**Output:** API service with migrations and testable health/user/profile endpoints.

### Plan 3: Auth, Onboarding, and Training Plan Generation

**Purpose:** Implement login or guest identity, 9-step onboarding, profile persistence, PPL/four-week plan generation, and local plan cache.

**Depends on:** Plans 1 and 2.

**Unblocks:** Home today workout and training flow.

**Output:** New user can complete onboarding and see a generated 28-day plan.

### Plan 4: Native Workout Session Loop

**Purpose:** Implement the Android workout state machine, set-level recording, weight/reps input, rest timer, pause/resume, feedback, summary, local-first persistence, and sync queue.

**Depends on:** Plan 3.

**Unblocks:** Core product value.

**Output:** User can complete a workout and recover interrupted sessions.

### Plan 5: Exercise Library Content and Media

**Purpose:** Expand exercise content to at least 70 exercises, add core 30 media, implement exercise list/detail/filtering, media caching, and fallback states.

**Depends on:** Backend content foundation and Android shell.

**Unblocks:** Product trust and launch readiness.

**Output:** Published exercise library is credible enough for store release.

### Plan 6: Nutrition, Achievements, and Profile Polish

**Purpose:** Migrate nutrition macros and recipe recommendations, implement achievement triggers, profile stats, settings, and user-facing compliance entry points.

**Depends on:** Workout loop and backend APIs.

**Unblocks:** MVP completeness.

**Output:** App has a complete profile/settings/nutrition/achievement layer.

### Plan 7: Domestic Store Submission and Release Hardening

**Purpose:** Prepare privacy/user agreement URLs, app filing materials, permission explanations, SDK list, screenshots, release signing, test account, and domestic device test report.

**Depends on:** Plans 1-6.

**Unblocks:** Domestic Android store submission.

**Output:** Release package and submission materials are ready.

## Execution Rule

Start with Plan 1 only. Do not scaffold backend, content admin, AI, payment, community, or media pipelines before the Android foundation and compliance shell passes verification.

## Verification Gates

Each child plan must pass these gates before the next plan starts:

1. Local build/test commands pass.
2. The planned user flow is manually smoke-tested.
3. The implementation is reviewed against the design spec.
4. Known gaps are documented in the plan or a follow-up issue.

