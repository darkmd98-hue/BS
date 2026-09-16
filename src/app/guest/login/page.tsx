import { headers } from "next/headers";
import { GuestLoginForm } from "@/components/guest/GuestLoginForm";

export default async function GuestLoginPage(props: {
  searchParams: Promise<{ res?: string }>;
}) {
  const headerList = await headers();
  const lodgeId = headerList.get("x-lodge-id") || "";
  const lodgeName = headerList.get("x-lodge-name") || "LodgeOS";
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <GuestLoginForm
        lodgeName={lodgeName}
        lodgeId={lodgeId}
        initialReservationId={searchParams.res}
      />
    </div>
  );
}

