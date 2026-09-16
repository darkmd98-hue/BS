import { getTenantContext } from "@/lib/tenant";
import { getChannelManagerData } from "@/lib/channels";
import { ChannelManagerClient } from "@/components/channels/ChannelManagerClient";

export default async function ChannelsPage() {
  const tenant = await getTenantContext();
  const data = await getChannelManagerData(tenant.lodgeId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ChannelManagerClient data={data} />
    </div>
  );
}

