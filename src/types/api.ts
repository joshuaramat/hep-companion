/**
 * Error code types for API responses
 */
export enum ApiErrorCode {
  _VALIDATION_ERROR = 'VALIDATION_ERROR',
  _INPUT_VALIDATION_ERROR = 'INPUT_VALIDATION_ERROR',
  _OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  _PARSE_ERROR = 'PARSE_ERROR',
  _GENERATION_ERROR = 'GENERATION_ERROR',
  _EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  _INVALID_STRUCTURE = 'INVALID_STRUCTURE',
  _MISSING_FIELDS = 'MISSING_FIELDS',
  _INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  _TOO_MANY_SUGGESTIONS = 'TOO_MANY_SUGGESTIONS',
  _UNEXPECTED_ERROR = 'UNEXPECTED_ERROR'
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
  [ApiErrorCode._VALIDATION_ERROR]: 'The exercise suggestions were not in the correct format.',
  [ApiErrorCode._INPUT_VALIDATION_ERROR]: 'Your input does not contain sufficient clinical information.',
  [ApiErrorCode._OPENAI_API_ERROR]: 'We\'re having trouble connecting to our AI service. Please try again shortly.',
  [ApiErrorCode._PARSE_ERROR]: 'We couldn\'t process the exercise suggestions. Please try again with more specific clinical details.',
  [ApiErrorCode._GENERATION_ERROR]: 'We couldn\'t generate exercise suggestions. Please try again with more specific clinical details.',
  [ApiErrorCode._EMPTY_RESPONSE]: 'No exercise suggestions were found for your request. Please try with more specific clinical information.',
  [ApiErrorCode._INVALID_STRUCTURE]: 'The exercise data was not structured correctly. Please try again with a different prompt.',
  [ApiErrorCode._MISSING_FIELDS]: 'Some required information is missing from the exercise suggestions.',
  [ApiErrorCode._INVALID_DATA_TYPE]: 'Some of the exercise data is in an incorrect format.',
  [ApiErrorCode._TOO_MANY_SUGGESTIONS]: 'Too many exercise suggestions were generated. Please try a more specific request.',
  [ApiErrorCode._UNEXPECTED_ERROR]: 'An unexpected error occurred. Please try again later.'
}; 