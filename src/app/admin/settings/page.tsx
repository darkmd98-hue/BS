import { Settings, Building2, Save } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Lodge Settings</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your lodge identity, contact details, and preferences.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 max-w-2xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
            Lodge Name
          </label>
          <input
            type="text"
            defaultValue="Hill View Heritage Lodge"
            className="mt-1 block w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-lodge-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
            Address
          </label>
          <input
            type="text"
            defaultValue="Main Road, Sringeri, Karnataka"
            className="mt-1 block w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-lodge-600 focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-lodge-700 hover:bg-lodge-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
