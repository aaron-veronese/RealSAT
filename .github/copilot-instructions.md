# Copilot instructions for RealSAT

These notes help AI agents be productive in this Next.js 14 + TypeScript app for a Digital SAT practice test.

## Architecture and data flow
- App Router structure under `app/` with client pages (many start with `"use client"`). Entry is `app/page.tsx` (Start New Test) → `/test/module/1/intro` → `/test/module/[id]` main runner → `/test/module/[id]/review` → `/test/results`.
- Questions source: **Supabase database** via `lib/supabase/questions.ts`. Questions are fetched dynamically from the `questions` table using the Supabase client configured in `lib/supabase/client.ts`.
- Database types: `types/db.ts` defines `DBQuestion` interface matching the Supabase schema.
- Data transformation: `lib/test-data.ts::generateModuleQuestions(...)` fetches questions from Supabase and transforms `DBQuestion` to `TestQuestion` from `lib/types.ts`.
- Question content structure: Both `content` and `answers` fields in the database are JSONB arrays of objects with `{type: "text"|"image"|"table", value: string}` format.
- Rendering: `components/rendered-content.tsx` uses `lib/content-renderer.ts` to split content into parts: text, LaTeX (`$$...$$`), images (`@@image-id@@` → `public/images/test1/<image-id>.png`), and simple tables (`|` delimited).
- Module runner: `app/test/module/[id]/page.tsx`
  - Loads/generates questions asynchronously from Supabase via `generateModuleQuestions`, tracks answers, flags, and per-question time.
  - English modules (1–2) support text highlighting persisted per question; math modules (3–4) add a floating Desmos calculator (loaded from CDN) with saved state.
  - Enforces timers via `sessionStorage` and blocks browser navigation during a module.
- Scoring: `lib/scoring.ts` compares answers (free-response uses a safe numeric evaluator and tolerance), aggregates by section, then maps raw→scaled with built-in conversion tables; returns `TestScore`.

## Client state and conventions
- Session keys (do not rename without migrating):
  - `module-<n>-questions`, `module-<n>-timer-end`, `module-<n>-completed`, `module-<n>-last-question`, `test-in-progress`, and per-question highlights `module-<n>-q<k>-highlights`.
- `TestQuestion.contentColumns` may contain multiple content blocks; `RenderedContent` iterates them with separators.
- UI is shadcn/radix-based: prefer components in `components/ui/*` (e.g., `Button`, `Card`, `RadioGroup`, `Progress`) and helper `cn` in `lib/utils.ts`.
- Theming via `next-themes` in `components/theme-provider.tsx`; `app/layout.tsx` wraps children and imports `katex` CSS.
- Next config: `next.config.mjs` sets `typescript.ignoreBuildErrors = true` and `images.unoptimized = true`.

## Developer workflows
- Run dev: `npm run dev`. Build/serve: `npm run build && npm run start`. Lint: `npm run lint`.
- Add/modify questions: Update the Supabase `questions` table directly. Ensure related images exist in `public/images/test1/` with IDs used in content (e.g., `@@89-3-10@@`).
- Tweak content parsing or math rendering in `lib/content-renderer.ts` and validate visually through `components/rendered-content.tsx` in the module runner.
- Update scoring logic or conversion tables only in `lib/scoring.ts`; maintain tolerance behavior for free-response parity (fractions like `30/20` are parsed numerically).

## Integration points
- **Supabase**: Database client configured in `lib/supabase/client.ts` using environment variables from `.env.local`. Questions fetched via `lib/supabase/questions.ts`.
- Desmos Graphing Calculator: injected in `app/test/module/[id]/page.tsx` from `https://www.desmos.com/api/v1.11/calculator.js` and controlled via `window.Desmos.*`. State stored in `sessionStorage` (`desmos-state`). Keep calculator creation/destruction patterns when refactoring.
- Icons via `lucide-react`; radix primitives via `@radix-ui/*`; charts via `recharts` (present in deps but not required by core test flow).

## Patterns, gotchas, and examples
- Client vs server: Pages that touch `window`, `sessionStorage`, or DOM selection must be client components and start with `"use client"` (see `app/test/module/[id]/page.tsx`).
- Use `RenderedContent` for any question or option text to ensure LaTeX, images, and tables render consistently (e.g., options in the module runner wrap with `<RenderedContent content={text} />`).
- Image conventions: an inline token like `@@89-1-12@@` renders from `/images/test1/89-1-12.png`. Missing files will 404 at runtime.
- Highlighting relies on `data-*` attributes and part/line indices; preserve `basePartIndex` usage when changing content layout.
- Type shapes to rely on: `lib/types.ts` defines `Test`, `TestModule`, `TestQuestion`, and score types. `types/db.ts` defines `DBQuestion` for database schema. Keep these stable for cross-file compatibility.
- Async data loading: `generateModuleQuestions` is async and returns a Promise. All callers must use `await` or `.then()`.

## When extending
- Prefer composing new UI with existing `components/ui/*` and theming.
- Preserve session key names and timer/navigation guards in the module runner.
- Database schema changes require updating `types/db.ts` and potentially the transformation logic in `lib/test-data.ts`.
- Keep question content/answers JSONB format consistent: array of objects with `type` and `value` properties.
