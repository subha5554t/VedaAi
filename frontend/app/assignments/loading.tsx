export default function AssignmentsLoading() {
  return (
    <div className="flex-1 px-5 pt-5 pb-6">
      {/* Header skeleton */}
      <div className="mb-4">
        <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-1.5" />
        <div className="h-3 w-52 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-9 w-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-4"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mb-2 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
            <div className="mt-4 pt-3 border-t border-gray-50 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
