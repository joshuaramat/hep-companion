import { 
  validateGPTResponse, 
  GPTValidationError,
  ValidationErrorType
} from '@/utils/gpt-validation';

describe('GPT Response Validation', () => {
  it('validates properly formatted responses', () => {
    const validResponse = [
      {
        exercise_name: "Quad Sets",
        sets: 3,
        reps: 10,
        frequency: "2x daily",
        citations: [
          {
            title: "Effectiveness of exercise therapy",
            authors: "Smith J, Johnson B",
            journal: "Journal of Physical Therapy",
            year: "2022",
            doi: "10.1234/jpt.2022.01",
            url: "https://example.com/article"
          }
        ]
      }
    ];

    const result = validateGPTResponse(validResponse);
    expect(result).toHaveLength(1);
    expect(result[0].exercise_name).toBe("Quad Sets");
  });

  it('rejects non-array responses with proper error type', () => {
    const nonArrayResponse = {
      exercise_name: "Quad Sets",
      sets: 3,
      reps: 10,
      frequency: "2x daily",
      citations: []
    };

    try {
      validateGPTResponse(nonArrayResponse);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GPTValidationError);
      expect((error as GPTValidationError)._code).toBe('INVALID_STRUCTURE');
      expect((error as GPTValidationError)._details?.errorType).toBe(ValidationErrorType._INVALID_STRUCTURE);
    }
  });

  it('rejects missing required fields with proper error type', () => {
    const missingFieldsResponse = [
      {
        // Missing exercise_name
        sets: 3,
        reps: 10,
        frequency: "2x daily",
        citations: [
          {
            title: "Test",
            authors: "Author",
            journal: "Journal",
            year: "2022"
          }
        ]
      }
    ];

    try {
      validateGPTResponse(missingFieldsResponse);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GPTValidationError);
      
      // Verify that the details include the missing field path
      const gpgError = error as GPTValidationError;
      const details = gpgError._details?.details || [];
      const hasMissingFieldError = Array.isArray(details) && 
        details.some(detail => 
          detail.path && detail.message && 
          detail.message.toLowerCase().includes('required')
        );
      
      expect(hasMissingFieldError).toBe(true);
    }
  });

  it('rejects invalid data types with proper error type', () => {
    const invalidTypeResponse = [
      {
        exercise_name: "Quad Sets",
        sets: "3", // Should be a number
        reps: 10,
        frequency: "2x daily",
        citations: [
          {
            title: "Test",
            authors: "Author",
            journal: "Journal",
            year: "2022"
          }
        ]
      }
    ];

    try {
      validateGPTResponse(invalidTypeResponse as any);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GPTValidationError);
      expect((error as GPTValidationError)._code).toBe('INVALID_DATA_TYPE');
    }
  });

  it('validates responses with valid year formats', () => {
    const responseWithStringYear = [
      {
        exercise_name: "Quad Sets",
        sets: 3,
        reps: 10,
        frequency: "2x daily",
        citations: [
          {
            title: "Test",
            authors: "Author",
            journal: "Journal",
            year: "2022" // String year
          }
        ]
      }
    ];

    const responseWithNumberYear = [
      {
        exercise_name: "Quad Sets",
        sets: 3,
        reps: 10,
        frequency: "2x daily",
        citations: [
          {
            title: "Test",
            authors: "Author",
            journal: "Journal",
            year: 2022 // Number year
          }
        ]
      }
    ];

    expect(validateGPTResponse(responseWithStringYear)).toBeTruthy();
    expect(validateGPTResponse(responseWithNumberYear)).toBeTruthy();
  });

  it('rejects empty responses', () => {
    try {
      validateGPTResponse(null);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GPTValidationError);
      expect((error as GPTValidationError)._code).toBe('EMPTY_RESPONSE');
    }

    try {
      validateGPTResponse([]);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GPTValidationError);
      expect((error as GPTValidationError)._code).toBe('EMPTY_RESPONSE');
    }
  });

  it('rejects responses with too many suggestions', () => {
    // Create an array with 11 suggestions (exceeding the 10 max)
    const tooManyItems = Array(11).fill({
      exercise_name: "Test Exercise",
      sets: 3,
      reps: 10,
      frequency: "Daily",
      citations: [
        {
          title: "Test",
          authors: "Author",
          journal: "Journal",
          year: "2022"
        }
      ]
    });

    try {
      validateGPTResponse(tooManyItems);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GPTValidationError);
      expect((error as GPTValidationError)._code).toBe('TOO_MANY_SUGGESTIONS');
    }
  });

  it('validates responses with maximum allowed citations', () => {
    // Create a response with 5 citations (the maximum allowed)
    const maxCitations = Array(5).fill({
      title: "Test Citation",
      authors: "Author Name",
      journal: "Test Journal",
      year: "2022"
    });

    const response = [
      {
        exercise_name: "Test Exercise",
        sets: 3,
        reps: 10,
        frequency: "Daily",
        citations: maxCitations
      }
    ];

    const result = validateGPTResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0].citations).toHaveLength(5);
  });

  it('rejects responses with too many citations', () => {
    // Create a response with 6 citations (exceeding the 5 max)
    const tooCitations = Array(6).fill({
      title: "Test Citation",
      authors: "Author Name",
      journal: "Test Journal",
      year: "2022"
    });

    const response = [
      {
        exercise_name: "Test Exercise",
        sets: 3,
        reps: 10,
        frequency: "Daily",
        citations: tooCitations
      }
    ];

    try {
      validateGPTResponse(response);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GPTValidationError);
      expect((error as GPTValidationError)._details?.details[0].path).toContain('citations');
    }
  });
}); 