# Changelog

All notable changes to the HEP Companion project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-05-28

### Added
- Documentation organization improvements with structured subdirectories
- Enhanced error message formatting for better readability
- Improved script output clarity for development tools
- Better status indicators in verification and testing scripts

### Changed
- Reorganized docs directory structure for better navigation
- Moved implementation summaries to dedicated subdirectory
- Updated all documentation for improved readability and professional appearance
- Enhanced script output formatting for clearer development feedback
- Improved environment validation error messages
- Standardized text-based status indicators across all tools

### Fixed
- Documentation formatting inconsistencies
- Script output readability issues
- Error message clarity in environment validation

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