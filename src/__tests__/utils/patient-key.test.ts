import { generatePatientKey, verifyPatientKey } from '@/utils/patient-key';
import crypto from 'crypto';

// Mock the crypto module
jest.mock('crypto', () => {
  const mockHash = {
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-hash'),
  };
  return {
    createHash: jest.fn().mockReturnValue(mockHash),
  };
});

describe('Patient Key Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePatientKey', () => {
    it('should generate a hash from MRN and clinic ID', () => {
      const mrn = '123456';
      const clinicId = 'CLINIC-123';
      
      const result = generatePatientKey(mrn, clinicId);
      
      // Verify crypto was called correctly
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(crypto.createHash('sha256').update).toHaveBeenCalledWith('123456CLINIC-123');
      expect(crypto.createHash('sha256').digest).toHaveBeenCalledWith('hex');
      
      // Verify correct result
      expect(result).toBe('mocked-hash');
    });

    it('should throw an error if MRN is missing', () => {
      expect(() => generatePatientKey('', 'CLINIC-123')).toThrow(
        'Both MRN and clinic ID are required to generate a patient key'
      );
    });

    it('should throw an error if clinic ID is missing', () => {
      expect(() => generatePatientKey('123456', '')).toThrow(
        'Both MRN and clinic ID are required to generate a patient key'
      );
    });

    it('should throw an error if both MRN and clinic ID are missing', () => {
      expect(() => generatePatientKey('', '')).toThrow(
        'Both MRN and clinic ID are required to generate a patient key'
      );
    });
  });

  describe('verifyPatientKey', () => {
    it('should return true if patient key matches generated key', () => {
      const patientKey = 'mocked-hash';
      const mrn = '123456';
      const clinicId = 'CLINIC-123';
      
      const result = verifyPatientKey(patientKey, mrn, clinicId);
      
      expect(result).toBe(true);
    });
    
    it('should return false if patient key does not match generated key', () => {
      const patientKey = 'different-hash';
      const mrn = '123456';
      const clinicId = 'CLINIC-123';
      
      const result = verifyPatientKey(patientKey, mrn, clinicId);
      
      expect(result).toBe(false);
    });
    
    it('should return false if patient key is missing', () => {
      const result = verifyPatientKey('', '123456', 'CLINIC-123');
      
      expect(result).toBe(false);
    });
    
    it('should return false if MRN is missing', () => {
      const result = verifyPatientKey('mocked-hash', '', 'CLINIC-123');
      
      expect(result).toBe(false);
    });
    
    it('should return false if clinic ID is missing', () => {
      const result = verifyPatientKey('mocked-hash', '123456', '');
      
      expect(result).toBe(false);
    });
  });
}); 