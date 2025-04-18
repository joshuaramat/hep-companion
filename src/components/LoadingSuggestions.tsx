export default function LoadingSuggestions() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="text-lg text-gray-600">Generating your personalized exercise suggestions...</p>
      <p className="text-sm text-gray-500">This may take a few moments</p>
    </div>
  );
} 