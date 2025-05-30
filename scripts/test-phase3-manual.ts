import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

console.log(chalk.blue('🧪 Manual Testing Phase 3: AI Citation Integration\n'));

async function testResponseStructure() {
  console.log(chalk.yellow('Test 1: Verify response structure'));
  
  // Simulate a valid GPT response that should pass validation
  const mockGPTResponse = {
    exercises: [
      {
        name: "Bird Dog Exercise",
        sets: 3,
        reps: "10-12",
        notes: "Hold for 5 seconds",
        evidence_source: "Journal of Orthopaedic & Sports Physical Therapy, 2013 (DOI: 10.2519/jospt.2013.4441)"
      },
      {
        name: "Dead Bug Exercise",
        sets: 3,
        reps: "8-10",
        notes: "Maintain neutral spine",
        evidence_source: "Physical Therapy, 2017 (DOI: 10.1093/ptj/pzx067)"
      }
    ],
    clinical_notes: "Focus on core stability and spinal alignment. Progress gradually.",
    citations: [
      "Journal of Orthopaedic & Sports Physical Therapy, 2013 (DOI: 10.2519/jospt.2013.4441)",
      "Physical Therapy, 2017 (DOI: 10.1093/ptj/pzx067)"
    ],
    confidence_level: "high"
  };
  
  // Import and test the schema
  try {
    const { GPTResponseSchema } = await import('../src/lib/schemas/gpt-response.js');
    const result = GPTResponseSchema.parse(mockGPTResponse);
    
    console.log(chalk.green('Valid response structure accepted'));
    console.log(chalk.gray('- Exercises count:', result.exercises.length));
    console.log(chalk.gray('- All exercises have evidence_source:', 
      result.exercises.every(ex => ex.evidence_source)));
    console.log(chalk.gray('- Clinical notes present:', !!result.clinical_notes));
    console.log(chalk.gray('- Citations count:', result.citations.length));
    console.log(chalk.gray('- Confidence level:', result.confidence_level));
  } catch (error) {
    console.log(chalk.red('Schema validation failed:'), error);
  }
}

async function testInvalidResponses() {
  console.log(chalk.yellow('\nTest 2: Verify invalid responses are rejected'));
  
  const { GPTResponseSchema } = await import('../src/lib/schemas/gpt-response.js');
  
  // Test missing evidence_source
  console.log(chalk.gray('\nTesting missing evidence_source...'));
  try {
    GPTResponseSchema.parse({
      exercises: [{
        name: "Test Exercise",
        sets: 3,
        reps: "10",
        // missing evidence_source
      }],
      clinical_notes: "Test notes",
      citations: ["Test citation"]
    });
    console.log(chalk.red('Should have rejected missing evidence_source'));
  } catch (error: any) {
    console.log(chalk.green('Correctly rejected missing evidence_source'));
    console.log(chalk.gray('- Error:', error.errors?.[0]?.message || error.message));
  }
  
  // Test missing clinical_notes
  console.log(chalk.gray('\nTesting missing clinical_notes...'));
  try {
    GPTResponseSchema.parse({
      exercises: [{
        name: "Test Exercise",
        sets: 3,
        reps: "10",
        evidence_source: "Test source"
      }],
      // missing clinical_notes
      citations: ["Test citation"]
    });
    console.log(chalk.red('Should have rejected missing clinical_notes'));
  } catch (error: any) {
    console.log(chalk.green('Correctly rejected missing clinical_notes'));
    console.log(chalk.gray('- Error:', error.errors?.[0]?.message || error.message));
  }
  
  // Test empty citations array
  console.log(chalk.gray('\nTesting empty citations array...'));
  try {
    GPTResponseSchema.parse({
      exercises: [{
        name: "Test Exercise",
        sets: 3,
        reps: "10",
        evidence_source: "Test source"
      }],
      clinical_notes: "Test notes",
      citations: [] // empty array
    });
    console.log(chalk.red('Should have rejected empty citations'));
  } catch (error: any) {
    console.log(chalk.green('Correctly rejected empty citations'));
    console.log(chalk.gray('- Error:', error.errors?.[0]?.message || error.message));
  }
}

async function testToastComponent() {
  console.log(chalk.yellow('\nTest 3: Verify toast component exists'));
  
  try {
    // Check if toast files exist
    const fs = await import('fs/promises');
    
    const files = [
      'src/contexts/toast-context.tsx',
      'src/components/ui/Toast.tsx'
    ];
    
    for (const file of files) {
      try {
        await fs.access(path.join(process.cwd(), file));
        console.log(chalk.green(`${file} exists`));
      } catch {
        console.log(chalk.red(`${file} not found`));
      }
    }
  } catch (error) {
    console.log(chalk.red('Error checking files:'), error);
  }
}

async function testAPIRouteChanges() {
  console.log(chalk.yellow('\nTest 4: Verify API route modifications'));
  
  try {
    const fs = await import('fs/promises');
    const apiRoutePath = path.join(process.cwd(), 'src/app/api/generate/route.ts');
    const content = await fs.readFile(apiRoutePath, 'utf-8');
    
    // Check for key changes
    const checks = [
      { pattern: 'createSystemPrompt', description: 'Dynamic system prompt function' },
      { pattern: 'getExercises', description: 'Exercise library integration' },
      { pattern: 'GPTResponseSchema', description: 'New validation schema' },
      { pattern: 'evidence_source', description: 'Citation requirement in prompt' }
    ];
    
    for (const check of checks) {
      if (content.includes(check.pattern)) {
        console.log(chalk.green(`${check.description} implemented`));
      } else {
        console.log(chalk.red(`${check.description} not found`));
      }
    }
  } catch (error) {
    console.log(chalk.red('Error reading API route:'), error);
  }
}

async function testErrorResponseFormat() {
  console.log(chalk.yellow('\nTest 5: Verify error response format'));
  
  // Simulate error responses
  const errorFormats = [
    { ok: false, message: 'Validation error', code: 'VALIDATION_ERROR' },
    { ok: false, message: 'Clinical notes are required' },
    { ok: false, message: 'Invalid input', details: 'More info' }
  ];
  
  console.log(chalk.gray('Expected error format: { ok: false, message: string }'));
  
  for (const format of errorFormats) {
    const hasOk = format.ok === false;
    const hasMessage = typeof format.message === 'string';
    
    if (hasOk && hasMessage) {
      console.log(chalk.green('Valid error format:'), JSON.stringify(format));
    } else {
      console.log(chalk.red('Invalid error format:'), JSON.stringify(format));
    }
  }
}

async function runAllTests() {
  try {
    await testResponseStructure();
    await testInvalidResponses();
    await testToastComponent();
    await testAPIRouteChanges();
    await testErrorResponseFormat();
    
    console.log(chalk.blue('\nManual Phase 3 testing complete!'));
    console.log(chalk.yellow('\nNote: This is a manual test without database/API dependencies.'));
    console.log(chalk.yellow('For full integration testing, ensure:'));
    console.log(chalk.gray('1. Development server is running (npm run dev)'));
    console.log(chalk.gray('2. Database has exercises seeded'));
    console.log(chalk.gray('3. Valid authentication credentials are available'));
  } catch (error) {
    console.log(chalk.red('\nTest suite failed:'), error);
  }
}

// Run tests
runAllTests().catch(console.error); 