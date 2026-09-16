export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse p-6">
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded-md w-64"></div>
        <div className="h-4 bg-gray-100 rounded-md w-96"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
