'use client';

import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">
        Thanks for your feedback!
      </h1>
      
      <p className="text-gray-600 mb-8">
        Your input helps us improve the exercise suggestions for physical therapists.
      </p>

      <button
        onClick={() => router.push('/')}
        className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Start New Prompt
      </button>
    </div>
  );
} 