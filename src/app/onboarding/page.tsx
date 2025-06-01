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

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [profession, setProfession] = useState('physical_therapist');
  const [organization, setOrganization] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  
  // Check if user is authenticated and if they've already completed onboarding
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not authenticated, redirect to login
        router.push('/auth/login?redirectUrl=/onboarding');
        return;
      }
      
      setUser(session.user);
      
      // Check if user has already completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.onboarding_completed) {
        // User has already completed onboarding
        router.push('/');
        return;
      }
      
      // Pre-fill name from auth data if available
      if (session.user.user_metadata?.full_name) {
        setFullName(session.user.user_metadata.full_name);
      }
      
      // If they have already started but not completed onboarding, restore their data
      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.profession) setProfession(profile.profession);
        if (profile.clinic_id) setClinicId(profile.clinic_id);
        if (profile.organization) setOrganization(profile.organization);
        
        // If they have organization information, consider step 1 complete
        if (profile.full_name && profile.profession) {
          // Set the correct step based on their progress
          if (profile.clinic_id && profile.organization) {
            setStep(3); // They have completed org selection, go to final step
          } else {
            setStep(2); // They have completed profile but need to select org
          }
        }
      }
    };
    
    checkUser();
  }, [router, supabase]);
  
  const handleOrgSelect = (org: Organization) => {
    setSelectedOrg(org);
    setOrganization(org.name);
    setClinicId(org.clinic_id);
    
    // Save the organization selection immediately
    updateUserProfile({
      clinic_id: org.clinic_id,
      organization: org.name
    });
    
    // Move to the next step automatically
    setStep(3);
  };
  
  const handleCreateOrg = async (name: string) => {
    setLoading(true);
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
      
      setSelectedOrg({
        id: org.id,
        name: org.name,
        clinic_id: org.clinic_id
      });
      setOrganization(org.name);
      setClinicId(org.clinic_id);
      
      // Save the organization selection immediately
      await updateUserProfile({
        clinic_id: org.clinic_id,
        organization: org.name
      });
      
      // Move to the next step automatically
      setStep(3);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to update user profile incrementally
  const updateUserProfile = async (data: Record<string, any>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      // Don't show this error to the user, just log it
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 3) {
      // Save data for the current step before advancing
      if (step === 1) {
        await updateUserProfile({
          full_name: fullName,
          profession
        });
      }
      
      setStep(step + 1);
      return;
    }
    
    // Final step - save all data and mark onboarding as complete
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          clinic_id: clinicId,
          profession,
          organization,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Redirect to home page after successful onboarding
      router.push('/');
      
    } catch (error: any) {
      setError(error.message || 'Failed to save profile information');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Welcome to HEP Companion' : 
             step === 2 ? 'Your Practice' : 
             'Almost Done'}
          </h1>
          <p className="text-gray-600">
            {step === 1 ? 'Let\'s set up your profile' : 
             step === 2 ? 'Tell us about your practice' : 
             'Add any final details'}
          </p>
          
          {/* Progress indicator */}
          <div className="w-full flex justify-between mt-6 mb-8">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${step >= stepNumber ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {stepNumber}
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  {stepNumber === 1 ? 'Profile' : 
                   stepNumber === 2 ? 'Practice' : 
                   'Confirm'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Profile */}
          {step === 1 && (
            <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
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
                  <option value="physical_therapist">Physical Therapist</option>
                  <option value="occupational_therapist">Occupational Therapist</option>
                  <option value="athletic_trainer">Athletic Trainer</option>
                  <option value="physician">Physician</option>
                  <option value="other">Other Healthcare Professional</option>
                </select>
              </div>
            </>
          )}
          
          {/* Step 2: Practice Information */}
          {step === 2 && (
            <OrganizationSelector 
              onSelect={handleOrgSelect}
              onCreateNew={handleCreateOrg}
              defaultName={organization}
            />
          )}
          
          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-gray-900 mb-2">Profile Summary</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Name:</span> {fullName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Profession:</span> {profession.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Organization:</span> {organization || 'Not specified'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Clinic ID:</span> {clinicId || 'Not specified'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {user.email}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">
                  You can always update this information later from your profile settings.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-50"
              >
                Back
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || (step === 2 && !selectedOrg && !organization)}
              className={`${step < 3 ? 'bg-indigo-600' : 'bg-green-600'} text-white px-6 py-2 rounded-md hover:${step < 3 ? 'bg-indigo-700' : 'bg-green-700'} ml-auto ${(loading || (step === 2 && !selectedOrg && !organization)) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Loading...' : 
               step < 3 ? 'Continue' : 
               'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 