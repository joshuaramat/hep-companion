# HEP Companion - AI-Powered Exercise Suggestions

An AI-powered tool for physical therapists to generate personalized home exercise programs for their patients.

## Features

- Clinical scenario input with validation
- AI-generated exercise suggestions with dosing
- Feedback collection for continuous improvement
- Structured data storage in Supabase

## Tech Stack

- Next.js (App Router)
- Tailwind CSS
- Supabase (Postgres, Edge Functions)
- OpenAI GPT-4 Turbo
- TypeScript
- Zod for validation

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Set up your Supabase database with the following tables:

   ```sql
   -- prompts table
   create table prompts (
     id uuid default uuid_generate_v4() primary key,
     prompt_text text not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     raw_gpt_output jsonb not null
   );

   -- suggestions table
   create table suggestions (
     id uuid default uuid_generate_v4() primary key,
     prompt_id uuid references prompts(id) not null,
     exercise_name text not null,
     sets integer not null,
     reps integer not null,
     frequency text not null
   );

   -- feedback table
   create table feedback (
     id uuid default uuid_generate_v4() primary key,
     prompt_id uuid references prompts(id) not null,
     suggestion_id uuid references suggestions(id),
     relevance_score integer not null,
     comment text,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Enter a clinical scenario in the input field
2. Click "Generate Suggestions" to get AI-generated exercise recommendations
3. Review and rate each suggestion
4. Submit feedback to help improve the system

## Error Handling

The application includes comprehensive error handling for:
- Invalid user input
- GPT API failures
- Database operations
- Network issues

## License

MIT
