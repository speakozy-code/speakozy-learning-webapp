# Project: Speakozy Learning Webapp

React + Vite + TypeScript single-page app for an English academy. It is a separate project from the live operations site; do not deploy it over `speakozy.web.app`.

Public preview: https://speakozy-code.github.io/speakozy-learning-webapp/
GitHub repo: https://github.com/speakozy-code/speakozy-learning-webapp

## Commands

- `npm ci` — install dependencies
- `npm run dev` — dev server on http://localhost:3000
- `npm test` — domain tests plus curriculum integrity checks
- `npm run build` — TypeScript check and production build into `dist/`

## Architecture

- `src/types.ts` — data entities (`Level`, `Session`, `Question`, `DictionaryEntry`, `AppData`, ...).
- `src/lib/driveCurriculum.ts` — checked-in generated dataset: 7 ordered levels (E1, E2, E3, Inter 1, Inter 2, Inter 3, Upper 1), 50 sessions, 200 questions, 580 enriched words, 114 grammar notes. Treat it as a generated artifact; edit carefully and keep it valid JSON inside the TS export.
- `src/lib/seed.ts` — demo seed built from that dataset.
- `src/lib/store.tsx` — single persistence adapter: demo localStorage, Firebase or Supabase. `KEY` is versioned; bump it when the seed schema changes.
- `src/lib/lessonContent.ts` — derives grammar slides, exercises, homework and overview blocks from raw section text.
- `src/pages/Student.tsx` — student flows: roadmap, session tabs, vocabulary cards, grammar practice, quiz, dictionary.
- `src/pages/Admin.tsx` — admin dashboards and editors.
- `.github/workflows/deploy.yml` — on every push to `main`: npm ci, npm test, npm run build, then publish `dist/` to the `gh-pages` branch. Pages rebuilds automatically.

## Content and UX rules

- Interface is English and LTR. Arabic is allowed only for word meanings and explanations, rendered with `dir="rtl"`.
- Dark navy theme with a green accent; white is not the default surface.
- Each vocabulary card shows: word, part of speech, Arabic meaning, English definition, IPA transcript, native audio, example, and four YouGlish links (US, UK, AUS, CAN). YouGlish URLs are built in `Student.tsx`.
- Subscription plans gate levels; locked levels stay visible with a lock badge. Verify gating with a restricted demo account, not the admin account.
- Never commit secrets. `.env.example` is a template only. Firebase web config values are public by design; service-account JSON is not.
- No GitHub Actions workflow deploys to a production backend — the Pages workflow only publishes the static demo build.
