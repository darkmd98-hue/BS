import React from "react";
import { getTenantContext } from "@/lib/tenant";

export default async function AdminPage() {
  const tenant = await getTenantContext();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome to {tenant.lodgeName} administration portal.
        </p>
      </div>
    </div>
  );
}
