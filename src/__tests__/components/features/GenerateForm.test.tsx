import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GenerateForm from '@/components/features/GenerateForm';
import { validateClinicalInput } from '@/services/utils/validation';

// Mock the dependencies
jest.mock('@/services/utils/validation', () => ({
  validateClinicalInput: jest.fn()
}));

jest.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    error: null,
    handleApiError: jest.fn(),
    clearError: jest.fn()
  })
}));

describe('GenerateForm Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (validateClinicalInput as jest.Mock).mockReturnValue({ isValid: true, error: null });
  });

  it('renders correctly', () => {
    const mockSubmit = jest.fn();
    render(<GenerateForm onSubmit={mockSubmit} isLoading={false} />);
    
    // Check if key elements are rendered
    expect(screen.getByLabelText(/clinical scenario/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe the patient's condition/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate exercises/i })).toBeInTheDocument();
  });

  it('disables submit button when no input is provided', () => {
    const mockSubmit = jest.fn();
    render(<GenerateForm onSubmit={mockSubmit} isLoading={false} />);
    
    // Button should be disabled initially
    const submitButton = screen.getByRole('button', { name: /generate exercises/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when valid input is provided', () => {
    const mockSubmit = jest.fn();
    render(<GenerateForm onSubmit={mockSubmit} isLoading={false} />);
    
    // Add some text to the textarea
    const textarea = screen.getByLabelText(/clinical scenario/i);
    fireEvent.change(textarea, { target: { value: 'Patient has lower back pain' } });
    
    // Button should be enabled now
    const submitButton = screen.getByRole('button', { name: /generate exercises/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows loading state when isLoading is true', () => {
    const mockSubmit = jest.fn();
    render(<GenerateForm onSubmit={mockSubmit} isLoading={true} />);
    
    // Check if loading indicator is shown
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows validation error when clinical input is invalid', async () => {
    // Set up the validation mock to return invalid
    (validateClinicalInput as jest.Mock).mockReturnValue({ 
      isValid: false, 
      error: 'Please include specific clinical terms' 
    });
    
    const mockSubmit = jest.fn();
    render(<GenerateForm onSubmit={mockSubmit} isLoading={false} />);
    
    // Add some text and submit the form
    const textarea = screen.getByLabelText(/clinical scenario/i);
    fireEvent.change(textarea, { target: { value: 'Too vague' } });
    
    const submitButton = screen.getByRole('button', { name: /generate exercises/i });
    fireEvent.click(submitButton);
    
    // Check if validation error is shown
    await waitFor(() => {
      expect(screen.getByText(/please include specific clinical terms/i)).toBeInTheDocument();
    });
    
    // Submit function should not be called
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits form with trimmed input when validation passes', async () => {
    // Set up validation mock to pass
    (validateClinicalInput as jest.Mock).mockReturnValue({ isValid: true, error: null });
    
    const mockSubmit = jest.fn().mockResolvedValue(undefined);
    render(<GenerateForm onSubmit={mockSubmit} isLoading={false} />);
    
    // Add some text with extra spaces and submit the form
    const textarea = screen.getByLabelText(/clinical scenario/i);
    fireEvent.change(textarea, { target: { value: '  Patient has chronic knee pain  ' } });
    
    const submitButton = screen.getByRole('button', { name: /generate exercises/i });
    fireEvent.click(submitButton);
    
    // Check if submit was called with trimmed input
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('Patient has chronic knee pain');
    });
  });

  it('clears validation error when user starts typing again', async () => {
    // Set up validation mock to fail initially
    (validateClinicalInput as jest.Mock).mockReturnValue({ 
      isValid: false, 
      error: 'Please include specific clinical terms' 
    });
    
    const mockSubmit = jest.fn();
    render(<GenerateForm onSubmit={mockSubmit} isLoading={false} />);
    
    // Add some text and submit to trigger validation error
    const textarea = screen.getByLabelText(/clinical scenario/i);
    fireEvent.change(textarea, { target: { value: 'Too vague' } });
    
    const submitButton = screen.getByRole('button', { name: /generate exercises/i });
    fireEvent.click(submitButton);
    
    // Check if validation error is shown
    await waitFor(() => {
      expect(screen.getByText(/please include specific clinical terms/i)).toBeInTheDocument();
    });
    
    // Start typing again
    fireEvent.change(textarea, { target: { value: 'Too vague with more details' } });
    
    // Validation error should be cleared
    expect(screen.queryByText(/please include specific clinical terms/i)).not.toBeInTheDocument();
  });
}); 