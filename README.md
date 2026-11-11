<p align="center">
  <img src="public/chayan_logo_readme.svg" alt="ChayanJobs - select right. serve right." width="380" />
</p>

<p align="center">
  One simple place to find government and private jobs, results, admit cards,
  answer keys, syllabi, and admission updates across India.
</p>

<p align="center">
  <a href="https://www.chayanjobs.com"><img src="https://img.shields.io/badge/Live_Site-chayanjobs.com-0f766e?style=flat-square" alt="Live site" /></a>
  <img src="https://img.shields.io/github/license/qyronx558/Chayan?style=flat-square&color=blue" alt="License" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## About

ChayanJobs helps job seekers stop checking dozens of websites every day. It brings official job notifications, exam updates, and preparation resources into one fast, easy-to-use website.

The platform is free to use, works on mobile and desktop, and can be installed like an app.

**Live website:** [www.chayanjobs.com](https://www.chayanjobs.com)

---

## Features

- **One search for everything** - jobs, results, admit cards, answer keys, syllabi, admissions, and blogs.
- **Personalised alerts** - get notified about opportunities that match your qualification and location.
- **Application tracker** - keep track of every job you are interested in, from application to result.
- **Exam calendar** - see upcoming exams, admit cards, and result dates in one calendar.
- **Save for later** - bookmark jobs and revisit them anytime.
- **Works everywhere** - mobile-friendly, fast, and available in light and dark mode.

---

## Tech Stack

<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,nodejs,prisma,postgres,redis,vercel,docker,githubactions&theme=dark" alt="Tech stack" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Auth.js-000000?style=for-the-badge&logo=authjs&logoColor=white" alt="Auth.js" />
  <img src="https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black" alt="Neon" />
  <img src="https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white" alt="Resend" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
</p>

| Part | Tools |
| --- | --- |
| **Website** | Next.js, React, TypeScript, Tailwind CSS |
| **Data** | PostgreSQL, Prisma |
| **Sign-in** | Auth.js with Google login |
| **Hosting** | Vercel, GitHub Actions, Docker |

---

## Getting Started

### Requirements

- Node.js 22 or newer
- PostgreSQL 16 or newer
- npm

### Installation

```bash
git clone https://github.com/qyronx558/Chayan.git
cd Chayan
npm install
```

### Environment variables

```bash
cp .env.example .env
```

Open `.env` and add at least:

```dotenv
DATABASE_URL="postgresql://user:password@localhost:5432/govjobs"
AUTH_SECRET="your-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Set up the database

```bash
npm run db:generate
npm run db:migrate:deploy
npx prisma db seed
```

### Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run with Docker

```bash
docker compose up -d
```

The app will be available at [http://127.0.0.1:3000](http://127.0.0.1:3000) (this machine only).

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app locally |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run db:generate` | Prepare the database client |
| `npm run db:migrate:deploy` | Apply database updates |
| `npx prisma studio` | Open the database viewer |

---

## Tests and code quality

Every pull request to `main` runs the **CI** workflow. A PR can merge only when all of these pass:

1. **Lint & type check** - ESLint (no errors, warnings may not grow) and TypeScript.
2. **Tests & coverage** - all unit and integration tests pass and line coverage stays at **35% or more**.
3. **Python flows** - Ruff lint/format and pytest for the Prefect flows (via [uv](https://docs.astral.sh/uv/)).

Run the same checks on your machine before pushing:

| Command | What it does |
| --- | --- |
| `npm run check` | Run **everything** CI runs (lint, types, tests + coverage, Python) |
| `npm run fix` | Auto-fix lint and formatting issues (TypeScript and Python) |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run typecheck` | TypeScript type check |
| `npm test` | All unit + integration tests |
| `npm run test:unit` / `npm run test:integration` | One kind of test only |
| `npm run test:watch` | Re-run tests as you edit |
| `npm run test:coverage` | Tests + coverage report (fails under 35%) - open `coverage/index.html` |
| `npm run py:lint` / `npm run py:fix` / `npm run py:test` | Python lint, auto-fix, tests (needs `uv`) |
| `npm run test:e2e:contact` | Browser test of the contact page (needs Playwright + running app) |

Test layout mirrors the source tree, using the same file names:

```text
src/lib/dates.ts                    ->  tests/unit/lib/dates.test.ts
src/lib/trending/score.ts           ->  tests/unit/lib/trending/score.test.ts
src/lib/trending/rank.ts            ->  tests/integration/lib/trending/rank.test.ts
src/app/api/contact/route.ts        ->  tests/integration/api/contact/route.test.ts
middleware.ts                       ->  tests/unit/middleware.test.ts
prefect/newsletter_digest_flow.py   ->  tests/python/test_newsletter_digest_flow.py
```

- `tests/unit` - one module at a time, everything else mocked.
- `tests/integration` - several real modules (or an API route) working together, with only the database and outside services faked.
- `tests/e2e` - Playwright scripts against a running app (run by hand).

Install uv once: `pip install uv` (or see the [uv install guide](https://docs.astral.sh/uv/getting-started/installation/)), then `uv sync`.

---

## Deployment

There are three environments: **local** (your machine only), **dev** (private team site) and **production** (the public site).

- Merging to `main` deploys to **dev** only.
- Code reaches **production** only when a team member publishes a GitHub Release and a reviewer approves it.
- Dev and local show a coloured banner and are hidden from search engines.

Full guide, release steps and one-time setup: [docs/environments.md](docs/environments.md).

---

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes.
4. Run `npm run check` (and `npm run build`). Use `npm run fix` for small lint issues.
5. Commit using clear messages, push, and open a pull request.

Please keep pull requests focused and easy to review.

---

## License

Released under the [MIT License](LICENSE).

---

## Contact

- **Maintainer:** [Amit Kumar](https://github.com/qyronx558)
- **Website:** [www.chayanjobs.com](https://www.chayanjobs.com)
- **Project:** [github.com/qyronx558/Chayan](https://github.com/qyronx558/Chayan)

---

<p align="center"><em>select right. serve right.</em></p>
