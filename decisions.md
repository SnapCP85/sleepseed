# decisions.md — Architectural & Product Decisions Log

This file captures WHY decisions were made.

Goal: Prevent re-thinking, enable consistency, and preserve reasoning over time.

---

## Entry Format

### Decision Title
Date: YYYY-MM-DD  
Status: Proposed | Accepted | Deprecated  

Context:  
What problem were we solving?

Decision:  
What did we choose?

Alternatives Considered:  
- Option A
- Option B

Why This Won:  
Reasoning behind decision

Tradeoffs:  
What we accepted as downsides

Implications:  
What this affects going forward

---

## Example

### Use Serverless Functions for OG Images
Date: 2026-03-30  
Status: Accepted  

Context:  
Need dynamic social preview images for stories.

Decision:  
Use serverless endpoints for OG + image generation.

Alternatives Considered:  
- Static images
- External image service

Why This Won:  
- Dynamic per story
- Fast iteration
- No external dependency

Tradeoffs:  
- Slight cold start latency

Implications:  
- Must maintain endpoint performance
- Keep rendering lightweight

---

## Rules

- Log decisions for:
  - Architecture
  - Data models
  - UX systems
  - Platform strategy

- Do NOT log:
  - Minor fixes
  - Obvious choices

---

## Guideline

If you find yourself asking:
“Why did we do this?”

→ It should already be in this file.
