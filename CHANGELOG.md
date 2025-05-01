# Changelog

All notable changes to the HEP Companion project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Row-Level Security (RLS) policies for all database tables
- Audit logging system with automatic triggers
- 90-day purge job for audit logs
- Patient key hashing for MRN and clinic ID
- Security documentation in SECURITY-IMPLEMENTATION.md

### Changed
- Organized security migrations in scripts/migrations directory
- Applied security changes directly through Supabase dashboard
- Updated documentation to reflect implemented security features

## [0.2.0] - 2025-04-19

### Added
- Comprehensive input validation with clinical terminology checks
- GPT response validation with strict schema requirements
- Error handling system with user-friendly messages
- Retry logic for transient OpenAI API failures
- Response parsing with fallback mechanisms
- Custom error component for consistent UI feedback
- Unit tests for validation and error handling
- Jest test configuration
- Project documentation improvements

### Changed
- Enhanced clinical keyword detection with PT-specific terminology
- Improved error messaging for different error types
- Strengthened validation rules for clinical inputs
- Updated API route to handle validation more thoroughly

### Fixed
- Issue #1: GPT response validation edge cases
- Malformed JSON response handling
- Empty response handling
- Missing field validation

## [0.1.0] - 2025-04-16

### Added
- Initial application structure
- Next.js app router setup
- OpenAI GPT integration
- Basic clinical input field
- Exercise suggestion display
- Supabase database integration
- Basic error handling
- Initial documentation 