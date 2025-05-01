import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { logAudit } from '@/services/audit';

// Schema validation for organization creation
const organizationSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required').max(100),
  clinic_id: z.string().trim().optional()
});

/**
 * Create a new organization
 */
export async function POST(request: Request) {
  try {
    // Authentication check
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn('Unauthenticated access attempt to organization creation API');
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'AUTHENTICATION_ERROR' 
      }, { status: 401 });
    }
    
    // Parse and validate request
    const body = await request.json().catch(() => {
      throw new Error('Invalid JSON in request body');
    });
    
    try {
      organizationSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetail = error.errors[0];
        return NextResponse.json(
          { 
            error: errorDetail.message,
            code: 'VALIDATION_ERROR',
            field: errorDetail.path.join('.')
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Invalid organization data',
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      );
    }
    
    const { name, clinic_id } = body;
    
    // Instead of using the RPC function that has an ambiguous column error,
    // Use a direct query approach
    try {
      // First check if organization exists by clinic_id
      let org = null;
      if (clinic_id) {
        const { data: existingByClinicId } = await supabase
          .from('organizations')
          .select('id, name, clinic_id')
          .eq('clinic_id', clinic_id)
          .maybeSingle();
        
        if (existingByClinicId) {
          org = {
            id: existingByClinicId.id,
            name: existingByClinicId.name,
            clinic_id: existingByClinicId.clinic_id,
            created: false
          };
        }
      }

      // If not found by clinic_id, check by exact name match
      if (!org) {
        const { data: existingByName } = await supabase
          .from('organizations')
          .select('id, name, clinic_id')
          .ilike('name', name)
          .maybeSingle();
        
        if (existingByName) {
          org = {
            id: existingByName.id,
            name: existingByName.name,
            clinic_id: existingByName.clinic_id,
            created: false
          };
        }
      }

      // If still not found, create new organization
      if (!org) {
        // Generate a unique clinic ID if not provided
        let finalClinicId = clinic_id;
        if (!finalClinicId) {
          // Create a random clinic ID in the format CLINIC-XXXXXX
          const prefix = 'CLINIC';
          const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
          finalClinicId = `${prefix}-${randomPart}`;
        }

        const { data: newOrg, error: insertError } = await supabase
          .from('organizations')
          .insert({
            name: name,
            clinic_id: finalClinicId
          })
          .select('id, name, clinic_id')
          .single();
        
        if (insertError) {
          throw insertError;
        }

        org = {
          id: newOrg.id,
          name: newOrg.name,
          clinic_id: newOrg.clinic_id,
          created: true
        };
      }

      // Update the user's profile with the organization clinic_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          clinic_id: org.clinic_id,
          organization: org.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (profileError) {
        logger.error(`Error updating user profile with clinic: ${profileError.message}`);
        // Continue anyway since we have the organization
      }
      
      // Log audit
      await logAudit(org.created ? 'create' : 'select', 'organization', org.id, {
        organization_name: org.name,
        clinic_id: org.clinic_id,
        was_created: org.created
      });
      
      return NextResponse.json({
        success: true,
        data: org
      });
      
    } catch (orgError: any) {
      logger.error(`Error processing organization: ${orgError}`);
      return NextResponse.json({ 
        error: 'Failed to process organization',
        details: orgError.message || String(orgError),
        code: 'DATABASE_ERROR' 
      }, { status: 500 });
    }
    
  } catch (error) {
    logger.error('Organization creation error:', error);
    
    return NextResponse.json({ 
      error: 'An error occurred while processing the organization',
      code: 'UNEXPECTED_ERROR'
    }, { status: 500 });
  }
} 