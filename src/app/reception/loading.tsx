export default function ReceptionLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse p-6">
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded-md w-64"></div>
        <div className="h-4 bg-gray-100 rounded-md w-96"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-100 rounded w-20"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 shadow-sm">
          <div className="h-5 bg-gray-200 rounded w-48"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 shadow-sm">
          <div className="h-5 bg-gray-200 rounded w-48"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
