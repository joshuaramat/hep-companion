import { logAudit } from '@/services/audit';
import { cookies } from 'next/headers';

// Mock the dependencies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Create mocks before using them in another mock
const insertMock = jest.fn().mockResolvedValue({ error: null });
const fromMock = jest.fn().mockReturnValue({ insert: insertMock });
const getUserMock = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
  error: null,
});

const mockSupabaseClient = {
  auth: {
    getUser: getUserMock,
  },
  from: fromMock,
};

// Now use the mocks in the module mock
jest.mock('@/services/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Console error spy
let consoleErrorSpy: jest.SpyInstance;

describe('Audit Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock cookies store
    (cookies as jest.Mock).mockReturnValue('mock-cookie-store');
    
    // Reset mock default responses for each test
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    
    insertMock.mockResolvedValue({ error: null });
  });
  
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  
  it('should log an audit event successfully', async () => {
    // Arrange
    const action = 'create';
    const resourceType = 'prompt';
    const resourceId = 'prompt-123';
    const details = { field1: 'value1' };
    
    // Act
    await logAudit(action, resourceType, resourceId, details);
    
    // Assert
    expect(getUserMock).toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledWith('audit_logs');
    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user-123',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  
  it('should log error when user fetch fails', async () => {
    // Arrange
    const userError = new Error('Failed to fetch user');
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: userError,
    });
    
    // Act
    await logAudit('update', 'suggestion', 'suggestion-123');
    
    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to get user for audit log:',
      userError
    );
    expect(insertMock).not.toHaveBeenCalled();
  });
  
  it('should log error when user data is missing', async () => {
    // Arrange
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    
    // Act
    await logAudit('delete', 'feedback', 'feedback-123');
    
    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to get user for audit log:',
      null
    );
    expect(insertMock).not.toHaveBeenCalled();
  });
  
  it('should log error when insert fails', async () => {
    // Arrange
    const insertError = new Error('Failed to insert audit log');
    insertMock.mockResolvedValue({ error: insertError });
    
    // Act
    await logAudit('generate', 'prompt', 'prompt-123');
    
    // Assert
    expect(insertMock).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to create audit log:',
      insertError
    );
  });
  
  it('should handle unexpected errors during execution', async () => {
    // Arrange
    const unexpectedError = new Error('Unexpected error');
    getUserMock.mockRejectedValue(unexpectedError);
    
    // Act
    await logAudit('feedback', 'suggestion', 'suggestion-123');
    
    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error in audit logging:',
      unexpectedError
    );
  });
  
  it('should work with minimal parameters', async () => {
    // Act
    await logAudit('select', 'organization', 'org-123');
    
    // Assert
    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user-123',
      action: 'select',
      resource_type: 'organization',
      resource_id: 'org-123',
      details: undefined,
    });
  });
}); 