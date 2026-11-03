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

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app locally |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Check code quality |
| `npm run db:generate` | Prepare the database client |
| `npm run db:migrate:deploy` | Apply database updates |
| `npx prisma studio` | Open the database viewer |
| `npm run test:contact` | Run contact form tests |

---

## Deployment

The app is built for [Vercel](https://vercel.com). Add your production environment variables in the Vercel dashboard, then deploy.

Database updates are applied by the **database-migrate** GitHub Actions workflow. It needs one repository secret:

```text
DATABASE_URL
```

Run the workflow manually from the **Actions** tab after adding the secret.

---

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes.
4. Run `npm run lint` and `npm run build`.
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
