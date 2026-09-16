import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getGuestReservationDetails } from "@/lib/guest";
import { GuestPortalClient } from "@/components/guest/GuestPortalClient";

export default async function GuestReservationPage(props: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await props.params;
  const headerList = await headers();
  const lodgeId = headerList.get("x-lodge-id");

  if (!lodgeId || !reservationId) {
    notFound();
  }

  // Strictly query within lodgeId to prevent cross-tenant access
  const data = await getGuestReservationDetails(reservationId, lodgeId);

  if (!data) {
    notFound();
  }

  return <GuestPortalClient data={data} />;
}

