import { 
  validateGPTResponse, 
  GPTValidationError 
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

  it('rejects non-array responses', () => {
    const nonArrayResponse = {
      exercise_name: "Quad Sets",
      sets: 3,
      reps: 10,
      frequency: "2x daily",
      citations: []
    };

    expect(() => {
      validateGPTResponse(nonArrayResponse);
    }).toThrow(GPTValidationError);
  });

  it('rejects missing required fields', () => {
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

    expect(() => {
      validateGPTResponse(missingFieldsResponse);
    }).toThrow();
  });

  it('rejects invalid data types', () => {
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

    expect(() => {
      validateGPTResponse(invalidTypeResponse as any);
    }).toThrow();
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
}); 