/**
 * Error code types for API responses
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INPUT_VALIDATION_ERROR = 'INPUT_VALIDATION_ERROR',
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  INVALID_STRUCTURE = 'INVALID_STRUCTURE',
  MISSING_FIELDS = 'MISSING_FIELDS',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  TOO_MANY_SUGGESTIONS = 'TOO_MANY_SUGGESTIONS',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR'
}

/**
 * Structure for API error responses
 */
export interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode | string;
  details?: string | Record<string, any>;
  field?: string;
}

/**
 * User-friendly error messages for display in the UI
 */
export const errorMessages: Record<string, string> = {
  [ApiErrorCode.VALIDATION_ERROR]: 'The exercise suggestions were not in the correct format.',
  [ApiErrorCode.INPUT_VALIDATION_ERROR]: 'Your input does not contain sufficient clinical information.',
  [ApiErrorCode.OPENAI_API_ERROR]: 'We\'re having trouble connecting to our AI service. Please try again shortly.',
  [ApiErrorCode.PARSE_ERROR]: 'We couldn\'t process the exercise suggestions. Please try again with more specific clinical details.',
  [ApiErrorCode.GENERATION_ERROR]: 'We couldn\'t generate exercise suggestions. Please try again with more specific clinical details.',
  [ApiErrorCode.EMPTY_RESPONSE]: 'No exercise suggestions were found for your request. Please try with more specific clinical information.',
  [ApiErrorCode.INVALID_STRUCTURE]: 'The exercise data was not structured correctly. Please try again with a different prompt.',
  [ApiErrorCode.MISSING_FIELDS]: 'Some required information is missing from the exercise suggestions.',
  [ApiErrorCode.INVALID_DATA_TYPE]: 'Some of the exercise data is in an incorrect format.',
  [ApiErrorCode.TOO_MANY_SUGGESTIONS]: 'Too many exercise suggestions were generated. Please try a more specific request.',
  [ApiErrorCode.UNEXPECTED_ERROR]: 'An unexpected error occurred. Please try again later.'
}; 