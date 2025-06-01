# Server-Sent Events (SSE) Implementation

## Overview

The HEP Companion application now supports real-time progress updates during exercise generation using Server-Sent Events (SSE). This feature provides users with immediate feedback about the generation process, reducing perceived wait time and allowing cancellation.

## Features

- **Real-time Progress Updates**: Users see progress through 6 distinct stages
- **Time Estimates**: Based on historical data, users see estimated time remaining
- **Cancellation**: Users can cancel the generation process at any time
- **Backward Compatibility**: Toggle between streaming and classic modes
- **Performance Metrics**: System tracks stage durations for improved estimates

## Architecture

### API Endpoint

**`POST /api/generate-stream`**

This endpoint accepts the same request body as the original `/api/generate` endpoint but returns a Server-Sent Events stream instead of a JSON response.

#### Request Body
```json
{
  "prompt": "string (required, min 20 chars)",
  "mrn": "string (optional)",
  "clinic_id": "string (optional)"
}
```

#### Response Headers
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

#### Event Format
```
data: {
  "stage": "started|fetching-exercises|generating|validating|storing|complete",
  "message": "Human-readable status message",
  "progress": 0-100,
  "estimatedTimeRemaining": 1000,  // milliseconds
  "error": "ERROR_CODE"  // Only present on errors
}

data: {
  "type": "result",
  "data": { /* exercise generation result */ }
}
```

### Progress Stages

1. **started** (5%) - Initial setup and authentication
2. **fetching-exercises** (15%) - Loading exercise library from database
3. **generating** (40%) - GPT-4 processing the clinical scenario
4. **validating** (70%) - Validating GPT response format
5. **storing** (85%) - Saving to database
6. **complete** (100%) - Process finished successfully

### Database Schema

#### generation_metrics table
```sql
CREATE TABLE generation_metrics (
  id UUID PRIMARY KEY,
  stage TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

## Frontend Implementation

### useSSE Hook

A custom React hook manages the SSE connection:

```typescript
const { connect, disconnect, isConnected, error } = useSSE('/api/generate-stream', {
  onProgress: (event) => { /* handle progress */ },
  onResult: (data) => { /* handle final result */ },
  onError: (error, code) => { /* handle errors */ }
});
```

### Progress Component

The `GenerationProgress` component displays:
- Progress bar with percentage
- Current stage indicator
- Estimated time remaining
- Cancel button
- Stage progress dots

## Usage

### Enable Streaming Mode (Default)

Users will automatically get the streaming experience with real-time progress updates.

### Switch to Classic Mode

Users can toggle to classic mode via the UI switch, which:
- Uses the original `/api/generate` endpoint
- Shows the existing loading skeleton
- Maintains backward compatibility

### Cancellation

Users can cancel at any time by:
1. Clicking the X button in the progress modal
2. The system will abort the OpenAI request
3. Clean up the SSE connection
4. Show a cancellation toast message

## Error Handling

Errors are streamed as events with error codes:
- `AUTHENTICATION_ERROR` - User not authenticated
- `VALIDATION_ERROR` - Invalid input
- `OPENAI_API_ERROR` - OpenAI service issues
- `SERVER_ERROR` - Internal server errors

## Performance Considerations

1. **Metric Collection**: Only stores timing data, no PII
2. **Default Estimates**: Used when insufficient historical data
3. **Connection Management**: Automatic cleanup on component unmount
4. **Abort Controllers**: Proper cancellation of in-flight requests

## Testing

### Unit Tests
- `src/__tests__/app/api/generate-stream/route.test.ts`
- Tests streaming, cancellation, and error scenarios

### Integration Tests
- MSW handlers updated in `tests/integration/mocks/handlers.ts`
- Simulates SSE stream for E2E tests

## Migration Notes

1. Run the Supabase migration to create the metrics table:
   ```bash
   supabase db push
   ```

2. The existing `/api/generate` endpoint remains unchanged

3. User preferences for streaming mode are stored in localStorage

## Future Enhancements

- WebSocket implementation for bi-directional communication
- More granular progress within GPT generation stage
- Historical analytics dashboard for generation metrics
- Batch generation with parallel progress tracking 