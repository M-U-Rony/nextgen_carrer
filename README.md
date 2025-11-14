This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Required environment variables for full functionality:

- `MONGODB_URI` - MongoDB connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth session encryption
- `NEXTAUTH_URL` - Your application URL (e.g., http://localhost:3000)
- `GEMINI_API_KEY` or `GOOGLE_API_KEY` - Google Gemini API key (required for AI features: CareerBot, CV generation, Roadmap, CV extraction). Get your free API key at https://aistudio.google.com/app/apikey
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional, for Google sign-in)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional, for Google sign-in)

Optional environment variables:

- `GEMINI_MODEL` - Gemini model to use (default: gemini-2.0-flash-exp). Options: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
