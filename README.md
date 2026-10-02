# ChayanJobs

**India's most trusted government & private jobs portal - discover, track, and never miss an opportunity.**

![Build Status](https://img.shields.io/github/actions/workflow/status/officialamit558/ChayanJobs/ci.yml?branch=main)
![Version](https://img.shields.io/github/package-json/v/officialamit558/ChayanJobs)
![License](https://img.shields.io/github/license/officialamit558/ChayanJobs)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC)

---

## Overview

ChayanJobs is a production-ready job portal that aggregates government and private job notifications, exam results, admit cards, answer keys, syllabi, and admission updates from official sources across India. It solves the fragmentation problem where aspirants must check dozens of websites daily by providing a single, real-time, searchable platform with personalized alerts, application tracking, and an exam calendar - all in one place.

Built for scale, SEO, and AdSense monetization. Trusted by thousands of aspirants preparing for UPSC, SSC, Banking, Railway, Defence, and State PSC exams.

---

## Demo

**Live Site:** [https://www.chayanjobs.com](https://www.chayanjobs.com)

> *Screenshots coming soon - home page with featured slider, smart search, job cards, exam calendar, and personalized dashboard.*

---

## Features

### For Job Seekers
- **Unified Search** - Search across govt jobs, private jobs, results, admit cards, answer keys, syllabi, admissions, and blogs with category chips
- **Personalized Alerts** - In-app notifications for new jobs matching qualifications, location, and category preferences
- **Application Tracker** - Kanban-style board: Interested → Applied → Admit Card → Exam Done → Result
- **Exam Calendar** - Month-view calendar with exam/admit/result dates, type filters, and upcoming deadlines teaser on home
- **Qualification-based Discovery** - 32 qualification chips (10th, 12th, B.Tech, B.Sc, MBBS, MBA, Nursing, etc.) with token-level matching
- **Bookmarks & History** - Save jobs, track viewed items, resume upload for AI-powered recommendations

### Content Coverage
- **Government Jobs** - Central (UPSC, SSC, Banking, Railway, Defence) + State PSCs
- **Private Jobs** - Company-wise listings with direct apply links
- **Results** - Merit lists, cut-offs, scorecards with PDF links
- **Admit Cards** - Hall tickets with exam centre, timing, download links
- **Answer Keys** - Official keys with objection window tracking
- **Syllabi** - Subject-wise breakdowns with PDF downloads
- **Admissions** - University/college admissions with dates, fees, process
- **Blogs & Notifications** - Preparation guides, exam analysis, policy updates

### Technical
- **Server-side Rendering** - Next.js 15 App Router with ISR for SEO
- **Real-time Notifications** - SSE streaming + in-app bell icon with unread count
- **Google OAuth + Credentials** - NextAuth v5 (Auth.js) with JWT sessions
- **PWA Ready** - Installable, offline-capable (service worker)
- **Dark/Light Mode** - System-aware with manual toggle
- **Responsive** - Mobile-first, works on all devices

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS v4, shadcn/ui, Framer Motion |
| **State** | TanStack React Query, React Hook Form + Zod |
| **Database** | PostgreSQL (Neon/Supabase), Prisma ORM |
| **Auth** | NextAuth v5 (Credentials + Google OAuth) |
| **Caching** | Redis (optional), Next.js ISR |
| **Email** | Resend (transactional) |
| **Images** | Cloudinary (optimization + CDN) |
| **Hosting** | Vercel (Edge + Serverless) |
| **CI/CD** | GitHub Actions |

---

## Installation

```bash
git clone https://github.com/officialamit558/ChayanJobs.git
cd ChayanJobs

npm install

cp .env.example .env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, OAuth keys, etc.

npx prisma generate
npx prisma db push
npx prisma db seed

npm run dev
# Open http://localhost:3000
```

### Docker (Alternative)

```bash
docker-compose up -d
# App: http://localhost:3000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

---

## Usage

### Development
```bash
npm run dev          
npm run build        
npm run start        
npm run lint         
npm run typecheck    
```

### Database
```bash
npx prisma studio    
npx prisma migrate dev --name <name>  
npx prisma db push   
npx prisma db seed   
```

### Environment Variables
Required keys (see `.env.example`):
```
DATABASE_URL              
NEXTAUTH_SECRET           
NEXTAUTH_URL              
GOOGLE_CLIENT_ID         
GOOGLE_CLIENT_SECRET    
RESEND_API_KEY         
CLOUDINARY_*            
NEXT_PUBLIC_APP_URL     
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create a branch** - `git checkout -b feat/your-feature`
3. **Make changes** - Follow existing code style (ESLint + Prettier)
4. **Test** - Run `npm run lint`, `npm run typecheck`, `npm run build`
5. **Commit** - Use conventional commits: `feat: add exam calendar filters`
6. **Push** - `git push origin feat/your-feature`
7. **Open PR** - Target `main` branch with description

### Guidelines
- Write typed TypeScript (no `any`)
- Use existing UI components (shadcn/ui)
- Add tests for new features
- Update documentation if needed
- Keep PRs focused and small

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Contact & Acknowledgements

**Maintainer:** [Amit Kumar](https://github.com/officialamit558)

**Built with:**
- [Next.js](https://nextjs.org/) - The React Framework for Production
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [TanStack Query](https://tanstack.com/query) - Server state management
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Vercel](https://vercel.com/) - Hosting platform
- [Neon](https://neon.tech/) - Serverless Postgres
- [Resend](https://resend.com/) - Email API
- [Cloudinary](https://cloudinary.com/) - Image management

**Inspired by** the need for a single, reliable source for Indian government job aspirants who previously had to monitor 50+ official websites daily.

---

*Last updated: August 2026*
