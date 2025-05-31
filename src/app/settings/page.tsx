'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/services/supabase/client';
import OrganizationSelector from '@/components/features/OrganizationSelector';

type Organization = {
  id: string;
  name: string;
  clinic_id: string;
};

export default function SettingsPage() {
  const [fullName, setFullName] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [profession, setProfession] = useState('');
  const [organization, setOrganization] = useState('');
  const [_selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  
  // Load user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login?redirectUrl=/settings');
        return;
      }
      
      setUser(session.user);
      
      // Get user profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        setError('Failed to load profile data. Please try again later.');
      } else if (profile) {
        setFullName(profile.full_name || '');
        setClinicId(profile.clinic_id || '');
        setProfession(profile.profession || '');
        setOrganization(profile.organization || '');
      }
      
      setLoading(false);
    };
    
    fetchUserProfile();
  }, [router, supabase]);
  
  const handleOrgSelect = (org: Organization) => {
    setSelectedOrg(org);
    setOrganization(org.name);
    setClinicId(org.clinic_id);
    setShowOrgSelector(false);
  };
  
  const handleCreateOrg = async (name: string) => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create organization');
      }
      
      const { data: org } = await response.json();
      
      handleOrgSelect({
        id: org.id,
        name: org.name,
        clinic_id: org.clinic_id
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setSaving(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          clinic_id: clinicId,
          profession,
          organization,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setSuccessMessage('Settings saved successfully!');
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading your settings...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {successMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">
                    Profession
                  </label>
                  <select
                    id="profession"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a profession</option>
                    <option value="physical_therapist">Physical Therapist</option>
                    <option value="occupational_therapist">Occupational Therapist</option>
                    <option value="athletic_trainer">Athletic Trainer</option>
                    <option value="physician">Physician</option>
                    <option value="other">Other Healthcare Professional</option>
                  </select>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Practice Information</h2>
                
                {!showOrgSelector ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                        Organization / Hospital / Clinic
                      </label>
                      <div className="flex">
                        <input
                          id="organization"
                          type="text"
                          value={organization}
                          readOnly
                          className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                          placeholder="Your organization"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOrgSelector(true)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="clinicId" className="block text-sm font-medium text-gray-700 mb-1">
                        Clinic ID
                      </label>
                      <input
                        id="clinicId"
                        type="text"
                        value={clinicId}
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                        placeholder="Your clinic identifier"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will be used for associating patient records
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <OrganizationSelector 
                      onSelect={handleOrgSelect}
                      onCreateNew={handleCreateOrg}
                      defaultName={organization}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOrgSelector(false)}
                      className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 