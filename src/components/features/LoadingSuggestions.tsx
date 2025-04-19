export default function LoadingSuggestions() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 w-full pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold heading-gradient mb-4">
              Your Personalized Exercise Plan
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Based on evidence-based physical therapy practices and clinical guidelines. 
              Each exercise is supported by peer-reviewed research.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row justify-center gap-8 lg:gap-12">
            {[1, 2, 3].map((index) => (
              <div key={index} className="exercise-card bg-white rounded-xl shadow-md p-6 h-[600px]">
                <div className="p-6 flex-1 flex flex-col gap-6">
                  {/* Exercise Title Skeleton */}
                  <div className="h-24 flex items-center justify-center">
                    <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  
                  {/* Exercise Details Skeleton */}
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Rating Section Skeleton */}
                  <div className="space-y-4">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                      ))}
                    </div>
                  </div>

                  {/* Comment Section Skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-20 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>

                  {/* Research Evidence Button Skeleton */}
                  <div className="mt-auto">
                    <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 