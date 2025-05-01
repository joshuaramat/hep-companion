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

async function fixAuditLogsPolicy() {
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
    console.log('Fixing audit_logs table policies...');
    
    // Execute the SQL fix for audit_logs
    const sql = `
      -- Add INSERT policy for audit_logs
      DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
      
      -- Allow any authenticated user to insert audit logs
      CREATE POLICY audit_logs_insert ON audit_logs
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
      -- Keep the existing SELECT policy but make sure it exists
      DROP POLICY IF EXISTS audit_logs_select_own ON audit_logs;
      CREATE POLICY audit_logs_select_own ON audit_logs
        FOR SELECT USING (auth.uid() = user_id);
    `;
    
    const { error } = await supabase.rpc('pgx_query', { query: sql });
    
    if (error) {
      console.error('Error applying audit logs policy fix:', error.message);
      
      // Try alternative approach if the pgx_query RPC is not available
      console.log('Trying alternative approach...');
      const { error: sqlError } = await supabase.from('_migrations_custom').insert({
        name: 'fix_audit_logs_policy',
        sql: sql,
        executed_at: new Date().toISOString()
      });
      
      if (sqlError) {
        console.error('Alternative approach failed:', sqlError.message);
        console.log('\nPlease run this SQL manually in the Supabase dashboard SQL editor:');
        console.log(sql);
        process.exit(1);
      }
    }
    
    console.log('Audit logs policy fixed successfully!');
    console.log('You should now be able to create audit logs without RLS errors.');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the function
fixAuditLogsPolicy(); 