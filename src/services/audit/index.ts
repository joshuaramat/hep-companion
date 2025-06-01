import { createClient } from '@/services/supabase/server';

export type AuditAction = 'create' | 'update' | 'delete' | 'generate' | 'feedback' | 'select';
export type ResourceType = 'prompt' | 'suggestion' | 'feedback' | 'citation' | 'organization';

/**
 * Log an audit event for user actions
 * This is for application-level auditing in addition to database triggers
 * 
 * @param action - The action being performed
 * @param resourceType - The type of resource being accessed
 * @param resourceId - The ID of the resource
 * @param details - Optional additional details
 */
export async function logAudit(
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string,
  details?: any
) {
  const supabase = await createClient();
  
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Failed to get user for audit log:', userError);
      return;
    }
    
    // Insert the audit log
    const { error } = await supabase.from('audit_logs').insert({
      user_id: userData.user.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details
    });
    
    if (error) {
      console.error('Failed to create audit log:', error);
    }
  } catch (error) {
    console.error('Error in audit logging:', error);
  }
} 