# HEP Companion Sprint Implementation Plan

## Objective
You are an agentic AI tasked with implementing the remaining deliverables for the HEP Companion project sprint. Execute each phase systematically, ensuring each builds upon the previous phase's foundation.

## Project Context
- **Tech Stack**: Next.js 14, TypeScript, Supabase (PostgreSQL), Tailwind CSS, Vercel deployment
- **Domain**: Healthcare Exercise Prescription system for clinicians
- **Security**: HIPAA-adjacent requirements, patient data protection

## Implementation Phases

### PHASE 1: Security Infrastructure Foundation
**Priority**: CRITICAL - Must be completed before any user-facing features

#### 1.1 Security Headers Implementation
**Deliverable**: CSP + HSTS headers showing `max-age=31536000; preload` on `curl -I`

**Tasks**:
1. Create `middleware.ts` in project root with:
   - Content Security Policy (CSP) headers
   - HTTP Strict Transport Security (HSTS) with preload
   - X-Frame-Options, X-Content-Type-Options
   - Referrer-Policy
2. Test with `curl -I localhost:3000` to verify headers
3. Add security header tests to ensure compliance

**Acceptance Criteria**:
- `curl -I` shows CSP and `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- All security headers present and properly configured

#### 1.2 Environment Variable Guards
**Deliverable**: App fails fast on missing environment variables

**Tasks**:
1. Create `src/config/env.ts` with Zod schema validation
2. Add validation calls to `layout.tsx` and API routes
3. Ensure graceful error messages for missing vars
4. Add JSON error wrapper for all API responses

**Acceptance Criteria**:
- App crashes with clear error message if required env vars missing
- All API errors return `{ ok: boolean, message: string, data?: any }` format

### PHASE 2: Data Foundation & Clinical Content
**Priority**: HIGH - Required for AI prompt enhancement

#### 2.1 Exercise Library Database Implementation
**Deliverable**: 30-row exercise library with citation validation

**Tasks**:
1. Create Supabase migration for `exercises` table:
   ```sql
   CREATE TABLE exercises (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     condition TEXT NOT NULL, -- 'LBP', 'ACL', 'PFP'
     name TEXT NOT NULL,
     description TEXT NOT NULL,
     journal TEXT NOT NULL,
     year INTEGER NOT NULL,
     doi TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```
2. Create citation validation trigger:
   ```sql
   CREATE OR REPLACE FUNCTION validate_exercise_citation()
   RETURNS TRIGGER AS $$
   BEGIN
     IF NEW.journal IS NULL OR NEW.journal = '' THEN
       RAISE EXCEPTION 'Exercise must have journal citation';
     END IF;
     IF NEW.year IS NULL OR NEW.year < 1950 THEN
       RAISE EXCEPTION 'Exercise must have valid publication year';
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```
3. Seed database with 30 exercises (10 each: LBP, ACL, PFP)
4. Create TypeScript types and Supabase client functions

**Acceptance Criteria**:
- Database contains exactly 30 exercises (10 LBP, 10 ACL, 10 PFP)
- Trigger prevents insertion without journal or valid year
- All exercises have proper citations

#### 2.2 Exercise Data Seeding
**Deliverable**: Clinically accurate exercise data with proper citations

**Tasks**:
1. Research and compile 30 evidence-based exercises
2. Create seeding script with proper medical references
3. Validate all citations are from peer-reviewed sources
4. Test trigger functionality with invalid data

### PHASE 3: AI Enhancement & Response Validation
**Priority**: HIGH - Core functionality improvement

#### 3.1 GPT-4o Prompt with Citation Integration
**Deliverable**: Enhanced prompt using static exercise library with Zod validation

**Tasks**:
1. Modify `src/app/api/generate/route.ts`:
   - Fetch exercise library from database
   - Include exercise list in system prompt
   - Add citation requirements to prompt
2. Enhance `GPTResponseSchema` in `src/lib/schemas/gpt-response.ts`:
   ```typescript
   export const GPTResponseSchema = z.object({
     exercises: z.array(z.object({
       name: z.string(),
       sets: z.number().positive(),
       reps: z.string(),
       notes: z.string().optional(),
       evidence_source: z.string(), // NEW: citation requirement
     })),
     clinical_notes: z.string(),
     citations: z.array(z.string()), // NEW: reference list
     confidence_level: z.enum(['high', 'medium', 'low']).optional(),
   });
   ```
3. Implement validation error handling with JSON responses
4. Add toast notification system for validation failures

**Acceptance Criteria**:
- AI responses include proper exercise citations
- Schema validation catches malformed responses
- API returns `{ ok: false, message }` on validation failure
- UI shows toast notifications for errors

### PHASE 4: User Experience Enhancements
**Priority**: MEDIUM - Improves usability significantly

#### 4.1 Side Panel Implementation
**Deliverable**: Ctrl+Shift+P hotkey with EMR copy functionality

**Tasks**:
1. Create `src/components/features/side-panel/SidePanel.tsx`:
   - Slide-out panel component
   - Recording state management
   - Progress bar for AI generation
   - Copy to clipboard functionality
2. Add global hotkey listener in `layout.tsx`
3. Implement clipboard API for Chrome/Edge compatibility
4. Add recording state indicators (Record/Stop buttons)
5. Style with proper animations and responsive design

**Acceptance Criteria**:
- Ctrl+Shift+P opens/closes side panel
- Record/Stop buttons with visual progress indicators
- Copy button copies note JSON to clipboard in Chrome & Edge
- Panel is responsive and accessible

#### 4.2 Feedback Race Condition Fix
**Deliverable**: Idempotent feedback submission

**Tasks**:
1. Modify feedback API endpoint (`src/app/api/feedback/route.ts`):
   - Add unique constraint check
   - Implement idempotent writes
   - Add request debouncing
2. Update feedback UI components:
   - Disable buttons after click
   - Add loading states
   - Implement optimistic updates
3. Add database constraint for uniqueness

**Acceptance Criteria**:
- Double-clicking feedback buttons cannot create duplicate entries
- UI provides immediate feedback to user actions
- Database maintains data integrity

### PHASE 5: Analytics & Monitoring
**Priority**: MEDIUM - Important for product iteration

#### 5.1 Analytics Events Implementation
**Deliverable**: Feedback tracking with daily aggregation view

**Tasks**:
1. Ensure `analytics_events` table exists and is properly structured
2. Create `analytics_daily` SQL view:
   ```sql
   CREATE VIEW analytics_daily AS
   SELECT 
     DATE(created_at) as date,
     COUNT(*) as prompt_count,
     AVG(CASE WHEN rating = 'thumbs_up' THEN 1 ELSE 0 END) as avg_rating
   FROM analytics_events 
   GROUP BY DATE(created_at);
   ```
3. Add analytics dashboard endpoint
4. Create simple analytics viewing component

**Acceptance Criteria**:
- Feedback writes to `analytics_events` table
- Daily view aggregates prompt count and average rating
- Basic analytics dashboard accessible

### PHASE 6: Growth & Access Management
**Priority**: LOW - Can be deferred if needed

#### 6.1 Landing Page Implementation
**Deliverable**: Static landing page with PHI disclaimer

**Tasks**:
1. Create `src/app/landing/page.tsx`:
   - Hero section with value proposition
   - Clear PHI disclaimer
   - Professional medical styling
2. Add proper SEO metadata
3. Implement responsive design
4. Add call-to-action for pilot access

**Acceptance Criteria**:
- Professional landing page deployed
- Clear PHI disclaimer prominently displayed
- Responsive design across devices

## Implementation Guidelines

### Code Quality Standards
- **TypeScript**: Strict mode, no `any` types
- **Testing**: Add tests for critical paths
- **Security**: Validate all inputs, sanitize outputs
- **Performance**: Lazy load components, optimize images
- **Accessibility**: WCAG 2.1 AA compliance

### Development Workflow
1. Create feature branch for each deliverable
2. Implement with comprehensive error handling
3. Add appropriate logging for debugging
4. Test thoroughly before moving to next phase
5. Update documentation as you build

### Error Handling Strategy
- All API routes must return consistent JSON format
- Client-side errors should show user-friendly messages
- Log errors appropriately for debugging
- Implement graceful degradation where possible

### Database Migration Strategy
- Create reversible migrations
- Test on development environment first
- Include proper indexing for performance
- Document all schema changes

## Success Metrics
- **Phase 1**: Security headers pass all tests
- **Phase 2**: 30 exercises loaded, trigger prevents invalid data
- **Phase 3**: AI responses include citations, validation works
- **Phase 4**: Side panel functional, no race conditions
- **Phase 5**: Analytics collecting data properly
- **Phase 6**: Landing page deployed and accessible

## Risk Mitigation
- Back up database before schema changes
- Test security headers in staging environment
- Validate AI prompt changes don't break existing functionality
- Ensure clipboard API works across target browsers
- Have rollback plan for each phase

Execute each phase completely before moving to the next. Document any blockers or deviations from the plan, and adjust subsequent phases accordingly. 