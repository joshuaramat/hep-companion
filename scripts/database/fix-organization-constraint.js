#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Also load .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envLocalConfig = require('dotenv').parse(fs.readFileSync(envLocalPath));
  for (const k in envLocalConfig) {
    process.env[k] = envLocalConfig[k];
  }
}

async function fixOrganizationConstraint() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Supabase URL or service role key is missing');
    console.error('Make sure you have a .env or .env.local file with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('Current environment variables found:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    process.exit(1);
  }

  // Create admin client with service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    console.log('Fixing organization foreign key constraint issues...');
    
    // 1. First, identify all distinct clinic_ids in profiles that don't have corresponding organizations
    const { data: missingOrgs, error: missingError } = await supabase
      .from('profiles')
      .select('clinic_id, organization')
      .not('clinic_id', 'is', null)
      .not('clinic_id', 'eq', '')
      .filter('clinic_id', 'not.in', `(select clinic_id from organizations)`);
    
    if (missingError) {
      throw new Error(`Error finding missing organizations: ${missingError.message}`);
    }

    console.log(`Found ${missingOrgs?.length || 0} profiles with clinic IDs that don't have organizations`);
    
    if (missingOrgs && missingOrgs.length > 0) {
      // Group by clinic_id to avoid duplicates
      const uniqueOrgs = {};
      missingOrgs.forEach(profile => {
        if (!uniqueOrgs[profile.clinic_id]) {
          uniqueOrgs[profile.clinic_id] = profile.organization || `Organization ${profile.clinic_id}`;
        }
      });
      
      // Create the missing organizations
      let created = 0;
      for (const [clinicId, orgName] of Object.entries(uniqueOrgs)) {
        console.log(`Creating organization "${orgName}" with clinic ID "${clinicId}"...`);
        
        const { data: newOrg, error: insertError } = await supabase
          .from('organizations')
          .insert({ 
            name: orgName,
            clinic_id: clinicId
          })
          .select()
          .single();
        
        if (insertError) {
          console.error(`  Error creating organization: ${insertError.message}`);
        } else {
          console.log(`  Created successfully with ID: ${newOrg.id}`);
          created++;
        }
      }
      
      console.log(`\nCreated ${created} missing organizations`);
    } else {
      console.log('No missing organizations found, all clinic IDs are valid!');
    }
    
    // 2. Now check for any profiles with invalid clinic_ids (null or empty but with organization name)
    const { data: invalidProfiles, error: invalidError } = await supabase
      .from('profiles')
      .select('id, organization')
      .or('clinic_id.is.null,clinic_id.eq.')
      .not('organization', 'is', null)
      .not('organization', 'eq', '');
    
    if (invalidError) {
      throw new Error(`Error finding invalid profiles: ${invalidError.message}`);
    }
    
    console.log(`\nFound ${invalidProfiles?.length || 0} profiles with organization name but missing clinic ID`);
    
    if (invalidProfiles && invalidProfiles.length > 0) {
      // Create organizations and update profiles for these users
      let updated = 0;
      
      for (const profile of invalidProfiles) {
        // Check if organization already exists
        const { data: existingOrgs, error: existingError } = await supabase
          .from('organizations')
          .select('*')
          .ilike('name', profile.organization)
          .limit(1);
        
        if (existingError) {
          console.error(`  Error checking for existing organization: ${existingError.message}`);
          continue;
        }
        
        let clinicId;
        
        if (existingOrgs && existingOrgs.length > 0) {
          // Use existing organization
          clinicId = existingOrgs[0].clinic_id;
          console.log(`  Found existing organization "${existingOrgs[0].name}" with clinic ID "${clinicId}"`);
        } else {
          // Create a new organization
          const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
          clinicId = `CLINIC-${randomSuffix}`;
          
          const { error: createError } = await supabase
            .from('organizations')
            .insert({
              name: profile.organization,
              clinic_id: clinicId
            });
          
          if (createError) {
            console.error(`  Error creating organization: ${createError.message}`);
            continue;
          }
          
          console.log(`  Created new organization "${profile.organization}" with clinic ID "${clinicId}"`);
        }
        
        // Update the profile with the clinic ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ clinic_id: clinicId })
          .eq('id', profile.id);
        
        if (updateError) {
          console.error(`  Error updating profile: ${updateError.message}`);
        } else {
          console.log(`  Updated profile ID ${profile.id} with clinic ID "${clinicId}"`);
          updated++;
        }
      }
      
      console.log(`\nUpdated ${updated} profiles with proper clinic IDs`);
    }
    
    console.log('\nOrganization constraint issues have been fixed!');
    console.log('You should no longer see foreign key constraint errors.');
    
  } catch (error) {
    console.error('Error fixing organization constraints:', error.message);
    process.exit(1);
  }
}

// Run the function
fixOrganizationConstraint(); 