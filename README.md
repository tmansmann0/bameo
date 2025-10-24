# Bameo

Interactive, JSON-driven character cameo video toy for fun shareable recordings.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file based on the required Supabase environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in the values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL`.

3. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

## Project structure

- `app/` – Next.js App Router routes, including the home page, admin tools, and API endpoints.
- `lib/` – Shared utilities such as the Supabase client instance.

## Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key. |
| `NEXT_PUBLIC_SITE_URL` | Base URL where the app is hosted (e.g., `http://localhost:3000` for development or the production domain). |

Ensure these variables are present in `.env.local` before running the application.
