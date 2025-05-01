import crypto from 'crypto';

/**
 * Generates a SHA-256 hash from an MRN and clinic ID
 * This creates a deterministic pseudonym for a patient that can be used
 * for cross-note analytics without exposing PHI
 * 
 * @param mrn - The Medical Record Number
 * @param clinicId - The ID of the clinic
 * @returns A SHA-256 hash in hex format
 */
export function generatePatientKey(mrn: string, clinicId: string): string {
  if (!mrn || !clinicId) {
    throw new Error('Both MRN and clinic ID are required to generate a patient key');
  }
  
  // Create SHA-256 hash from MRN and clinic_id
  return crypto
    .createHash('sha256')
    .update(`${mrn}${clinicId}`)
    .digest('hex');
}

/**
 * Verifies if a patient key matches the expected value from an MRN and clinic ID
 * 
 * @param patientKey - The patient key to verify
 * @param mrn - The Medical Record Number
 * @param clinicId - The ID of the clinic
 * @returns Whether the patient key matches
 */
export function verifyPatientKey(patientKey: string, mrn: string, clinicId: string): boolean {
  if (!patientKey || !mrn || !clinicId) {
    return false;
  }
  
  const generatedKey = generatePatientKey(mrn, clinicId);
  return patientKey === generatedKey;
} 