# ONBOARDING - AI Context Guide

> Guide for AI agents: which files to read in which situation.

---

## First Time in Project

Read in this order:
1. `.context/STATE.md` - Current status (ALWAYS read first)
2. `.context/PROJECT.md` - What is this project
3. `.context/LEARNING.md` - How to interact with user

## Starting a Branch

1. `.context/STATE.md` - Check active branch
2. `.context/branches/XX-xxx/CONTEXT.md` - Branch scope
3. `.context/branches/XX-xxx/TODO.md` - What needs to be done
4. `.context/branches/XX-xxx/PROGRESS.md` - What's already done

## Writing Backend Code

1. `.context/ARCHITECTURE.md` - Backend structure & patterns
2. `.context/COMMANDS.md` - How to run/test
3. `.context/specs/<relevant-spec>.md` - Feature specification
4. `backend/prisma/schema.prisma` - Database schema (source of truth)

## Writing Frontend Code

1. `.context/ARCHITECTURE.md` - Frontend structure & patterns
2. `.context/specs/05-frontend.md` - Frontend architecture detail
3. `.context/COMMANDS.md` - How to run/test

## Adding a New Feature

1. `.context/REQUIREMENTS.md` - Find requirement IDs
2. `.context/specs/<relevant-spec>.md` - Feature specification
3. `.context/ARCHITECTURE.md` - Where it fits

## Making Decisions

1. `.context/DECISIONS.md` - Check existing decisions
2. `.context/PROJECT.md` - Project constraints
3. After deciding → append to DECISIONS.md

## Debugging

1. `.context/codebase/CONCERNS.md` - Known issues
2. `.context/debug/` - Previous debug sessions
3. `.context/research/PITFALLS.md` - Common pitfalls

## Planning / Tracking

1. `.context/ROADMAP.md` - Phase progress
2. `.context/WORKFLOW.md` - Branch strategy & merge flow
3. `.context/STATE.md` - Update at end of session

## Quick Reference

| Situation | Key File |
|-----------|----------|
| "What's the current status?" | STATE.md |
| "What tech stack?" | PROJECT.md |
| "How does auth work?" | specs/01-authentication.md |
| "What API endpoints?" | specs/02-api-design.md |
| "How to run project?" | COMMANDS.md |
| "What branch am I on?" | STATE.md + branches/XX/ |
| "Why was X decided?" | DECISIONS.md |
| "What's left to do?" | ROADMAP.md + branches/XX/TODO.md |
