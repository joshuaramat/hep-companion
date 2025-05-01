# HEP Companion - AI-Powered Exercise Suggestions

An AI-powered tool for physical therapists to generate personalized home exercise programs for their patients, with an emphasis on evidence-based practice and clinical validation.

## Features

- Clinical scenario input with comprehensive validation
- AI-generated exercise suggestions with evidence-based dosing
- Research citations for each exercise recommendation
- Robust error handling and input validation
- Feedback collection for continuous improvement
- Structured data storage in Supabase

## Tech Stack

- Next.js (App Router)
- Tailwind CSS
- Supabase (Postgres, Edge Functions)
- OpenAI GPT-4 Turbo
- TypeScript
- Zod for validation
- Jest for testing

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

   -- citations table
   create table citations (
     id uuid default uuid_generate_v4() primary key,
     suggestion_id uuid references suggestions(id) on delete cascade,
     title text not null,
     authors text not null,
     journal text not null,
     year text not null,
     doi text,
     url text not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Enter a clinical scenario in the input field with:
   - Specific patient information (condition, affected body part)
   - Clinical context (post-op, rehabilitation phase)
   - Treatment goals or limitations
2. Click "Generate Suggestions" to get AI-generated exercise recommendations
3. Review evidence-based exercises with citations
4. Review and rate each suggestion
5. Submit feedback to help improve the system

## Input Validation

The application implements strict validation for clinical inputs:
- Minimum 20 characters with at least 8 words
- Must contain at least 2 clinical terms (from an extensive list of PT terminology)
- Checks for sufficient clinical context before processing

## Error Handling

The application includes comprehensive error handling for:
- Invalid user input (pre-API validation)
- Malformed GPT responses
- Missing fields in responses
- OpenAI API failures (with retry mechanisms)
- Database operations
- Network issues

All errors provide user-friendly messages specific to the error type.

## Developing and Testing

The codebase includes extensive test coverage:
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- -t "validation|GPT|Retry"
```

Key test areas:
- Clinical input validation
- GPT response validation
- Retry mechanisms for API calls
- Error handling and classification

## Project Structure

```
src/
├── app/                # Next.js app router
│   ├── api/            # API routes
│   │   └── generate/   # Exercise generation endpoint
├── components/         # React components
│   ├── features/       # Feature components
│   └── ui/             # UI components
├── hooks/              # Custom React hooks
├── services/           # External service integrations
│   └── utils/          # Service utilities
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
    ├── gpt-validation.ts  # GPT response validation
    ├── logger.ts       # Logging utility
    └── retry.ts        # Retry mechanism
```

## Contributing

1. Ensure you understand the clinical context of the application
2. Follow the existing patterns and coding standards
3. Add tests for new functionality
4. Run the full test suite before submitting PRs
5. Update documentation as needed

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## License

MIT

## Security Features

HEP Companion includes robust security features to protect user data and maintain privacy:

- **Authentication**: All data access requires user authentication
- **Row-Level Security (RLS)**: Users can only access their own data
- **Audit Logging**: Complete audit trail of user actions
- **Patient Data Protection**: SHA-256 hashing of patient identifiers
- **Content Security Policy**: Protection against XSS attacks
- **HSTS**: Enforces secure HTTPS connections

### Security Setup

To enable security features:

```bash
# Run the security setup script
node scripts/deploy-security.js
```

See [Security Documentation](./docs/security/README.md) for more details.
