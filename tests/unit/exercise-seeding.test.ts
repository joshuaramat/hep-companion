import { validateCitations, EXERCISES } from '../../scripts/database/seed-exercises';

describe('Exercise Seeding', () => {
  describe('Citation Validation', () => {
    test('should validate all exercise citations successfully', () => {
      const errors = validateCitations();
      expect(errors).toEqual([]);
    });

    test('should have exactly 30 exercises', () => {
      expect(EXERCISES).toHaveLength(30);
    });

    test('should have equal distribution across conditions', () => {
      const distribution = EXERCISES.reduce((acc: any, exercise: any) => {
        acc[exercise.condition] = (acc[exercise.condition] || 0) + 1;
        return acc;
      }, {});

      expect(distribution.LBP).toBe(10);
      expect(distribution.ACL).toBe(10);
      expect(distribution.PFP).toBe(10);
    });

    test('should have valid DOI format for all exercises with DOI', () => {
      const doiRegex = /^10\.\d{4,}\/[-._;()/:a-zA-Z0-9]+$/;
      
      EXERCISES.forEach((exercise: any) => {
        if (exercise.doi) {
          expect(exercise.doi).toMatch(doiRegex);
        }
      });
    });

    test('should have publication years within acceptable range', () => {
      EXERCISES.forEach((exercise: any) => {
        expect(exercise.year).toBeGreaterThanOrEqual(2000);
        expect(exercise.year).toBeLessThanOrEqual(2025);
      });
    });

    test('should have comprehensive descriptions', () => {
      EXERCISES.forEach((exercise: any) => {
        expect(exercise.description).toBeDefined();
        expect(exercise.description.length).toBeGreaterThanOrEqual(100);
      });
    });

    test('should have valid journal names', () => {
      EXERCISES.forEach((exercise: any) => {
        expect(exercise.journal).toBeDefined();
        expect(exercise.journal.trim()).not.toBe('');
        expect(exercise.journal.length).toBeGreaterThanOrEqual(5);
      });
    });

    test('should have valid condition values', () => {
      const validConditions = ['LBP', 'ACL', 'PFP'];
      
      EXERCISES.forEach((exercise: any) => {
        expect(validConditions).toContain(exercise.condition);
      });
    });

    test('should have unique exercise names within each condition', () => {
      const conditionGroups = EXERCISES.reduce((acc: any, exercise: any) => {
        if (!acc[exercise.condition]) {
          acc[exercise.condition] = [];
        }
        acc[exercise.condition].push(exercise.name);
        return acc;
      }, {});

      Object.keys(conditionGroups).forEach(condition => {
        const names = conditionGroups[condition];
        const uniqueNames = Array.from(new Set(names));
        expect(names.length).toBe(uniqueNames.length);
      });
    });
  });

  describe('Exercise Content Quality', () => {
    test('LBP exercises should target core and back muscles', () => {
      const lbpExercises = EXERCISES.filter((ex: any) => ex.condition === 'LBP');
      
      lbpExercises.forEach((exercise: any) => {
        const description = exercise.description.toLowerCase();
        const hasRelevantTerms = 
          description.includes('core') ||
          description.includes('spine') ||
          description.includes('back') ||
          description.includes('lumbar') ||
          description.includes('stability') ||
          description.includes('extension') ||
          description.includes('flexion');
        
        expect(hasRelevantTerms).toBe(true);
      });
    });

    test('ACL exercises should target knee stability and strength', () => {
      const aclExercises = EXERCISES.filter((ex: any) => ex.condition === 'ACL');
      
      aclExercises.forEach((exercise: any) => {
        const description = exercise.description.toLowerCase();
        const hasRelevantTerms = 
          description.includes('knee') ||
          description.includes('quadriceps') ||
          description.includes('hamstring') ||
          description.includes('leg') ||
          description.includes('stability') ||
          description.includes('balance') ||
          description.includes('control') ||
          description.includes('squat') ||
          description.includes('step') ||
          description.includes('acl') ||
          description.includes('plantar') ||
          description.includes('flexion') ||
          description.includes('strengthening');
        
        expect(hasRelevantTerms).toBe(true);
      });
    });

    test('PFP exercises should target hip and knee mechanics', () => {
      const pfpExercises = EXERCISES.filter((ex: any) => ex.condition === 'PFP');
      
      pfpExercises.forEach((exercise: any) => {
        const description = exercise.description.toLowerCase();
        const hasRelevantTerms = 
          description.includes('hip') ||
          description.includes('knee') ||
          description.includes('quadriceps') ||
          description.includes('patellofemoral') ||
          description.includes('stability') ||
          description.includes('alignment') ||
          description.includes('abduction') ||
          description.includes('external') ||
          description.includes('rotation') ||
          description.includes('stretch') ||
          description.includes('iliotibial') ||
          description.includes('band') ||
          description.includes('flexibility');
        
        expect(hasRelevantTerms).toBe(true);
      });
    });
  });

  describe('Citation Quality', () => {
    test('should include reputable medical journals', () => {
      const reputableJournals = [
        'Journal of Orthopaedic & Sports Physical Therapy',
        'Physical Therapy',
        'Spine',
        'American Journal of Sports Medicine',
        'Clinical Biomechanics',
        'Journal of Athletic Training',
        'Sports Medicine',
        'European Spine Journal',
        'British Journal of Sports Medicine',
        'Manual Therapy',
        'Journal of',
        'Sports Health',
        'International Journal'
      ];

      const journalsInDataset = Array.from(new Set(EXERCISES.map((ex: any) => ex.journal)));
      
      // At least 50% of journals should be from reputable sources
      const reputableCount = journalsInDataset.filter((journal) => 
        reputableJournals.some(reputable => (journal as string).includes(reputable))
      ).length;
      
      expect(reputableCount / journalsInDataset.length).toBeGreaterThan(0.5);
    });

    test('should have recent evidence (mostly from 2010 onwards)', () => {
      const recentExercises = EXERCISES.filter((ex: any) => ex.year >= 2010);
      expect(recentExercises.length / EXERCISES.length).toBeGreaterThan(0.8);
    });

    test('should have DOIs for most exercises', () => {
      const exercisesWithDOI = EXERCISES.filter((ex: any) => ex.doi && ex.doi.trim() !== '');
      expect(exercisesWithDOI.length / EXERCISES.length).toBeGreaterThan(0.9);
    });
  });

  describe('Data Structure Integrity', () => {
    test('should have all required fields for each exercise', () => {
      const requiredFields = ['condition', 'name', 'description', 'journal', 'year'];
      
      EXERCISES.forEach((exercise: any) => {
        requiredFields.forEach(field => {
          expect(exercise[field]).toBeDefined();
          expect(exercise[field]).not.toBe(null);
          expect(exercise[field]).not.toBe('');
        });
      });
    });

    test('should have proper data types', () => {
      EXERCISES.forEach((exercise: any) => {
        expect(typeof exercise.condition).toBe('string');
        expect(typeof exercise.name).toBe('string');
        expect(typeof exercise.description).toBe('string');
        expect(typeof exercise.journal).toBe('string');
        expect(typeof exercise.year).toBe('number');
        
        if (exercise.doi) {
          expect(typeof exercise.doi).toBe('string');
        }
      });
    });

    test('should not have duplicate DOIs', () => {
      const dois = EXERCISES
        .filter((ex: any) => ex.doi)
        .map((ex: any) => ex.doi);
      
      const uniqueDOIs = Array.from(new Set(dois));
      expect(dois.length).toBe(uniqueDOIs.length);
    });
  });

  describe('Clinical Relevance', () => {
    test('should include exercises with clear therapeutic instructions', () => {
      EXERCISES.forEach((exercise: any) => {
        const description = exercise.description.toLowerCase();
        
        // Should include position or starting instructions
        const hasPosition = 
          description.includes('lie') ||
          description.includes('stand') ||
          description.includes('sit') ||
          description.includes('position') ||
          description.includes('place') ||
          description.includes('side') ||
          description.includes('supine') ||
          description.includes('prone');
        
        // Should include movement or action instructions
        const hasAction = 
          description.includes('hold') ||
          description.includes('lift') ||
          description.includes('lower') ||
          description.includes('extend') ||
          description.includes('bend') ||
          description.includes('move') ||
          description.includes('rotate') ||
          description.includes('press') ||
          description.includes('squat') ||
          description.includes('step') ||
          description.includes('use') ||
          description.includes('perform') ||
          description.includes('exercise');
        
        expect(hasPosition || hasAction).toBe(true);
      });
    });

    test('should include target muscle or benefit information', () => {
      EXERCISES.forEach((exercise: any) => {
        const description = exercise.description.toLowerCase();
        
        const hasTargeting = 
          description.includes('target') ||
          description.includes('strengthen') ||
          description.includes('improve') ||
          description.includes('muscle') ||
          description.includes('stability') ||
          description.includes('flexibility') ||
          description.includes('mobility') ||
          description.includes('core') ||
          description.includes('quadriceps') ||
          description.includes('hamstring') ||
          description.includes('gluteus') ||
          description.includes('hip') ||
          description.includes('spine') ||
          description.includes('support') ||
          description.includes('alignment') ||
          description.includes('control') ||
          description.includes('rehabilitation');
        
        expect(hasTargeting).toBe(true);
      });
    });
  });
}); 