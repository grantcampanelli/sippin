# Sippin Application

A Next.js application for tracking and managing your beverage collection.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Prisma** - ORM for PostgreSQL
- **NextAuth.js** - Authentication (Google OAuth + Email/Password)
- **Mantine** - UI component library
- **Resend** - Email service

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or pnpm

### Installation

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Set up your environment variables in `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sippin"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=Sippin Application <noreply@sippin.app>
```

3. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
sippin/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   └── auth/         # Authentication endpoints
│   ├── auth/              # Auth pages (signin, signup)
│   ├── dashboard/         # Dashboard page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── auth/             # Authentication components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── email.ts          # Email utilities
├── prisma/               # Prisma schema and migrations
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Features

- ✅ User authentication with Google OAuth
- ✅ Email/password authentication
- ✅ User registration
- ✅ Protected routes
- ✅ Mantine UI components
- ✅ Email service integration (Resend)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Next Steps

- Set up Google OAuth credentials in Google Cloud Console
- Generate a secure `NEXTAUTH_SECRET` (you can use `openssl rand -base64 32`)
- Configure your Resend API key
- Customize the application to your needs

