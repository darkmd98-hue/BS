import { createClient } from "@/lib/supabase/server";

export interface ChannelIntegration {
  id: string;
  lodgeId: string;
  channelName: "airbnb" | "booking_com" | "agoda" | "makemytrip" | "vrbo" | "expedia";
  displayName: string;
  propertyChannelId: string | null;
  syncStatus: "connected" | "syncing" | "paused" | "error" | "disconnected";
  isActive: boolean;
  syncInventory: boolean;
  syncRates: boolean;
  lastSyncAt: string | null;
}

export interface ChannelSyncLogEntry {
  id: string;
  channelName: string;
  syncType: "reservations_pull" | "inventory_push" | "rates_push" | "webhook";
  status: "success" | "failed" | "in_progress";
  itemsSynced: number;
  message: string | null;
  createdAt: string;
}

export interface ChannelDistributionItem {
  channel: string;
  displayName: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface ChannelManagerData {
  integrations: ChannelIntegration[];
  syncLogs: ChannelSyncLogEntry[];
  distribution: ChannelDistributionItem[];
  totalChannelBookings: number;
  totalChannelRevenue: number;
}

const DEFAULT_CHANNELS: Array<{
  channelName: ChannelIntegration["channelName"];
  displayName: string;
}> = [
  { channelName: "airbnb", displayName: "Airbnb" },
  { channelName: "booking_com", displayName: "Booking.com" },
  { channelName: "agoda", displayName: "Agoda" },
  { channelName: "makemytrip", displayName: "MakeMyTrip" },
];

export async function getChannelManagerData(lodgeId: string): Promise<ChannelManagerData> {
  const supabase = await createClient();

  // 1. Fetch channel integrations
  let integrations: ChannelIntegration[] = [];
  try {
    const { data: dbChannels } = await (supabase as any)
      .from("channel_integrations")
      .select("*")
      .eq("lodge_id", lodgeId);

    if (dbChannels && dbChannels.length > 0) {
      integrations = dbChannels.map((c: any) => ({
        id: c.id,
        lodgeId: c.lodge_id,
        channelName: c.channel_name,
        displayName: c.display_name,
        propertyChannelId: c.property_channel_id,
        syncStatus: c.sync_status,
        isActive: c.is_active,
        syncInventory: c.sync_inventory,
        syncRates: c.sync_rates,
        lastSyncAt: c.last_sync_at,
      }));
    }
  } catch {
    integrations = [];
  }

  // Ensure standard channels are present in list
  const existingNames = new Set(integrations.map((i) => i.channelName));
  for (const def of DEFAULT_CHANNELS) {
    if (!existingNames.has(def.channelName)) {
      integrations.push({
        id: `def_${def.channelName}`,
        lodgeId,
        channelName: def.channelName,
        displayName: def.displayName,
        propertyChannelId: null,
        syncStatus: "disconnected",
        isActive: false,
        syncInventory: true,
        syncRates: true,
        lastSyncAt: null,
      });
    }
  }

  // 2. Fetch sync logs
  let syncLogs: ChannelSyncLogEntry[] = [];
  try {
    const { data: logs } = await (supabase as any)
      .from("channel_sync_log")
      .select("id, channel_name, sync_type, status, items_synced, message, created_at")
      .eq("lodge_id", lodgeId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (logs) {
      syncLogs = logs.map((l: any) => ({
        id: l.id,
        channelName: l.channel_name,
        syncType: l.sync_type,
        status: l.status,
        itemsSynced: l.items_synced,
        message: l.message,
        createdAt: l.created_at,
      }));
    }
  } catch {
    syncLogs = [];
  }

  // 3. Channel breakdown from reservations & bills
  const { data: reservations } = await (supabase as any)
    .from("reservations")
    .select("id, channel_source")
    .eq("lodge_id", lodgeId);

  const { data: bills } = await (supabase as any)
    .from("bills")
    .select("reservation_id, net_amount")
    .eq("lodge_id", lodgeId);

  const billMap = new Map<string, number>();
  bills?.forEach((b: any) => {
    billMap.set(b.reservation_id, Number(b.net_amount) || 0);
  });

  const channelCounts: Record<string, { count: number; revenue: number }> = {
    direct: { count: 0, revenue: 0 },
    airbnb: { count: 0, revenue: 0 },
    booking_com: { count: 0, revenue: 0 },
    agoda: { count: 0, revenue: 0 },
    makemytrip: { count: 0, revenue: 0 },
  };

  reservations?.forEach((r: any) => {
    const src = r.channel_source || "direct";
    if (!channelCounts[src]) {
      channelCounts[src] = { count: 0, revenue: 0 };
    }
    channelCounts[src].count += 1;
    channelCounts[src].revenue += billMap.get(r.id) || 0;
  });

  const totalChannelBookings = reservations?.length || 0;
  const totalChannelRevenue = Object.values(channelCounts).reduce((a, b) => a + b.revenue, 0);

  const displayNames: Record<string, string> = {
    direct: "Direct Front Desk",
    airbnb: "Airbnb",
    booking_com: "Booking.com",
    agoda: "Agoda",
    makemytrip: "MakeMyTrip",
  };

  const distribution: ChannelDistributionItem[] = Object.entries(channelCounts)
    .map(([channel, data]) => ({
      channel,
      displayName: displayNames[channel] || channel,
      count: data.count,
      revenue: data.revenue,
      percentage: totalChannelBookings > 0 ? Math.round((data.count / totalChannelBookings) * 100) : 0,
    }))
    .filter((d) => d.count > 0 || d.channel === "direct" || d.channel === "airbnb");

  return {
    integrations,
    syncLogs,
    distribution,
    totalChannelBookings,
    totalChannelRevenue,
  };
}

