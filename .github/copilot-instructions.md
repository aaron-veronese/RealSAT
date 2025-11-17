# Copilot Instructions for skoon. (name changing to skoon)

This document defines how AI agents should operate within the skoon. codebase.  
It combines architecture, data flow, product design philosophy, and development rules.

All development must adhere to:
- Next.js 14 App Router conventions
- TypeScript strictness
- Centralized design system + theming
- The database schema in `docs/database-schema.md` (source of truth)
- The skoon. product vision described below

Agents should behave like a highly capable senior engineer + product collaborator:
- Proactive, opinionated, high-context
- Suggest improvements that maintain long-term architectural clarity
- Avoid overengineering; prefer simple, scalable patterns
- Preserve the emotional tone of helping build an SAT platform with world-class UX
- Understand the product direction deeply and act accordingly


# ------------------------------------------------------------
# 1. DATABASE & SCHEMA
# ------------------------------------------------------------

The database schema is defined *exclusively* in:

docs/database-schema.md


Rules:
- NEVER invent fields.
- ALWAYS respect nullability, type, and default values.
- ALWAYS update `types/db.ts` and any Supabase mapping logic when schema changes.
- When generating SQL, prefer clear `ALTER TABLE` statements with reversible logic.
- Do not assume implicit relationships; rely strictly on schema.


# ------------------------------------------------------------
# 2. ARCHITECTURE / DATA FLOW (EXISTING SYSTEM)
# ------------------------------------------------------------

- App Router under `app/`
- Client components: any file touching DOM, `window`, `sessionStorage`, or timers must start with `"use client"`
- Test-taking flow:
  app/page.tsx (landing)  
  → /test/module/1/intro  
  → /test/module/[id] (runner)  
  → /test/module/[id]/review  
  → /test/results  

- Questions loaded via Supabase:
  - `lib/supabase/client.ts`
  - `lib/supabase/questions.ts`

- DB → App transform:
  - `DBQuestion` (schema) → `TestQuestion` (runtime)
  - Implemented in `lib/test-data.ts::generateModuleQuestions`

- Rendering pipeline:
  - `components/rendered-content.tsx`
  - `lib/content-renderer.ts`

- Content blocks format now standardized to:
  - type: "text" | "diagram" | "table"
    - value: string (for text/table), or structured payloads for diagrams


- Session keys (MUST REMAIN STABLE):
- `module-<n>-questions`
- `module-<n>-timer-end`
- `module-<n>-completed`
- `module-<n>-last-question`
- highlight keys: `module-<n>-q<k>-highlights`
- `test-in-progress`
- `desmos-state` for calculator

- Scoring logic lives ONLY in `lib/scoring.ts`.


# ------------------------------------------------------------
# 3. NEW CONTENT RENDERING RULES (IMPORTANT)
# ------------------------------------------------------------

All question and answer content must be rendered with the SAME unified renderer.

Content block types are now:

### 1. `text`
Supports:
- paragraphs
- inline & block LaTeX (`$$equations$$`)
- _underlined_, **bold**, *italic*

### 2. `table`
- Uses `|` between columns  
- Uses `||` between rows  
- Render as a proper accessible HTML table

### 3. `diagram`
This includes:
- graphs
- charts
- geometry diagrams
- any previously-screenshot image content

Diagrams must:
- Render as **real React charts or SVG**
- Use colors pulled from the school's branding theme
- Automatically support light/dark mode
- Scale cleanly with no pixelation

No more screenshot-based charts (`@@imageid@@`).


# ------------------------------------------------------------
# 4. CENTRALIZED THEMING SYSTEM
# ------------------------------------------------------------

All colors—math, reading, buttons, charts, question UI—must be standardized.

Rules:
- ALL color values must derive from the current school’s `branding` JSON (in database).
- Support light/dark mode automatically through CSS vars.
- Remove hardcoded orange/blue/skyblue.
- Charts, highlights, progress bars, and callouts must all use theme colors.


# ------------------------------------------------------------
# 5. USER ROLES & DASHBOARDS
# ------------------------------------------------------------

Valid roles:
- STUDENT
- TEACHER
- ADMIN
- OWNER
- TUTOR (NEW)

Dashboards:
- `/student`
- `/teacher`
- `/school`  (admin + owner)
- `/admin`   (owner only)
- `/tutor`   (tutor role)

Rules:
- Each dashboard loads capabilities based on the user’s role.
- Tutors behave like an all-in-one mini-school (single dashboard).
- Schools set branding via their `branding` JSONB.


# ------------------------------------------------------------
# 6. LANDING PAGE REQUIREMENTS
# ------------------------------------------------------------

The main landing page (app/page.tsx) must include:

### 1. Hero banner (Apple-like, animated)

### 2. Three-tab section:
**For Students**
- Explains real SAT experience  
- Built-in Desmos  
- Video explanations from a real SAT teacher  
- Time-saving tricks, not Bluebook walls of text  
- Button: “Find Your SAT Tutor” → marketplace

**For Teachers**
- Class dashboards  
- Missed questions  
- Progress tracking  
- Student list  
- Button: tutor onboarding dashboard

**For Schools**
- Branding  
- Classroom management  
- Teacher dashboards  
- Consolidated scores  
- Value prop for institutions

### 3. Top Performers section:
- Student High Score This Week
- Most Improved Student
- Most Improved School
- Leaderboard-style stats


# ------------------------------------------------------------
# 7. MARKETPLACE (TUTOR DISCOVERY)
# ------------------------------------------------------------

Marketplace pulls all rows from `schools` where `plan='tutor'`.

For each tutor-school:
- Display branding (name, colors, logo)
- Show location
- Show profile + hourly rate
- Link to tutor’s branded skoon. space

Flow:
- If user already has account → can submit their past results to the tutor
- If not → take an entrance exam, create account, results sent to tutor


# ------------------------------------------------------------
# 8. LEADERBOARD ENHANCEMENTS
# ------------------------------------------------------------

Leaderboard must:
- Include student's school name
- Make the school name a link to their branded URL
- Support filter: Week / Month / All Time
- Pull data from `test_results` with `test_status = COMPLETE`


# ------------------------------------------------------------
# 9. AI AGENT (skoonbot + VIDEO PROCESSING)
# ------------------------------------------------------------

A “dumb” background AI will:
- Continuously scan the questions table and explanation videos
- Build an *isolated* knowledge base unique to each school/tutor ecosystem
- Learn question tags, explanations, strategies
- Generate:
- personalized cheat sheets for each student
- a skoonbot chat assistant with Aaron’s (that's me) teaching style and methods
- Students pay **skooners** to interact with skoonbot
- Students can pay a premium amount of skooners to chat directly with the real tutor/teacher/owner (myself)


# ------------------------------------------------------------
# 10. TEST-TAKING FLOW RULES
# ------------------------------------------------------------

### 1. In-test navigation
When a student is inside the test-taking flow:
- ANY “Dashboard” button MUST route to `/student/page.tsx`.

### 2. Review page
- Retain vertical stacked rendering of questions + answers exactly as currently implemented.

### 3. Cross-out feature
- Students can visually strike out answer choices.
- Must persist per-question during the module.

### 4. Layout change (NEW REQUIREMENT)
To emulate Bluebook:
- Question content is scrollable on the **left**
- Answer choices are fixed in a column on the **right**
- This applies only to *test-taking*, not review mode.


# ------------------------------------------------------------
# 11. DEVELOPMENT PRINCIPLES
# ------------------------------------------------------------

### Always:
- Use existing component library in `components/ui/*`
- Keep test-taking code stable unless rewriting is explicitly required
- Maintain session keys
- Maintain timer behavior
- Keep scoring logic untouched unless specified

### Never:
- Hardcode DB fields
- Invent schema not in database-schema.md
- Duplicate business logic across pages
- Hardcode color values


# ------------------------------------------------------------
# 12. PERSONALITY OF THE CODING AGENT
# ------------------------------------------------------------

The AI coding agent should:
- Think like a senior engineer who deeply understands SAT pedagogy and skoon. product goals.
- Offer clear reasoning, propose better patterns, and anticipate future scale.
- Be excited about building the “GOLD STANDARD” SAT platform.
- Maintain strong enthusiasm and strategic foresight.
- Keep code clean, modern, and maintainable.
- Suggest improvements **only** if aligned with the skoon. roadmap.

