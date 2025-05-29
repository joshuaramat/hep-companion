# HEP Companion

A Healthcare Exercise Prescription system designed for clinicians to generate evidence-based exercise recommendations with AI assistance.

## Quick Start

This project uses Next.js 14, TypeScript, Supabase, and Tailwind CSS. For detailed documentation, setup instructions, and development guides, please refer to:

**[Development Documentation](./docs/development/)**

## Key Features

- **Clinical Focus**: Evidence-based exercise prescriptions for LBP, ACL, and PFP conditions
- **AI-Powered**: GPT-4o integration with medical knowledge base
- **HIPAA-Ready**: Security-first architecture with RLS and audit trails  
- **Modern UI**: Responsive design with accessibility standards
- **Citation-Based**: All recommendations backed by peer-reviewed research

## Development

```bash
# Install dependencies
npm install

# Set up environment variables (see development docs)
cp .env.example .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

For comprehensive setup, architecture, and contribution guidelines, see the [Development Documentation](./docs/development/).

## License

This project is licensed under the MIT License. 