"use client";

import { useState, useTransition } from "react";
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings2,
  TrendingUp,
  DownloadCloud,
  UploadCloud,
  ShieldCheck,
  Loader2,
  Layers,
  Sparkles,
} from "lucide-react";
import type { ChannelManagerData, ChannelIntegration } from "@/lib/channels";
import {
  saveChannelIntegrationAction,
  triggerChannelSyncAction,
  importDemoChannelBookingAction,
} from "@/app/actions/channels";
import { formatCurrency } from "@/lib/utils";

const CHANNEL_THEMES: Record<string, { bg: string; text: string; icon: string }> = {
  airbnb: { bg: "bg-rose-50 border-rose-200", text: "text-rose-600", icon: "🏠" },
  booking_com: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: "🌐" },
  agoda: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: "🌴" },
  makemytrip: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: "✈️" },
};

export function ChannelManagerClient({ data }: { data: ChannelManagerData }) {
  const { integrations, syncLogs, distribution, totalChannelBookings, totalChannelRevenue } = data;

  const [channels, setChannels] = useState(integrations);
  const [selectedChannel, setSelectedChannel] = useState<ChannelIntegration | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isSyncing, startSync] = useTransition();
  const [isImporting, startImport] = useTransition();

  const handleSync = (channelName: string, channelId: string) => {
    setSyncFeedback(null);
    const fd = new FormData();
    fd.append("channel_name", channelName);
    fd.append("channel_id", channelId);

    startSync(async () => {
      const res = await triggerChannelSyncAction(fd);
      if (res.success) {
        setSyncFeedback(`Successfully synchronized inventory & rates with ${channelName.toUpperCase()} (${res.itemsSynced} rooms updated).`);
        setTimeout(() => setSyncFeedback(null), 3000);
      }
    });
  };

  const handleImportBooking = (channel: string) => {
    setSyncFeedback(null);
    const fd = new FormData();
    fd.append("channel", channel);

    startImport(async () => {
      const res = await importDemoChannelBookingAction(fd);
      if (res.success) {
        setSyncFeedback(`Simulated inbound booking received from ${channel.toUpperCase()}! Created reservation #${res.reservationId?.slice(0, 8)}.`);
        setTimeout(() => setSyncFeedback(null), 4000);
      }
    });
  };

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedChannel) return;

    const fd = new FormData(e.currentTarget);
    startSync(async () => {
      const res = await saveChannelIntegrationAction(fd);
      if (res.success) {
        setSelectedChannel(null);
        setSyncFeedback(`Settings saved for ${selectedChannel.displayName}.`);
        setTimeout(() => setSyncFeedback(null), 3000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0b1437] to-[#1c2966] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
              Two-Way Channel Manager
            </span>
            <span className="text-xs text-gray-300 font-medium">&bull; Real-time Calendar Sync</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">OTA & Channel Distribution</h1>
          <p className="text-xs text-gray-300">
            Automatically sync room availability, pricing, and reservations across Airbnb, Booking.com, Agoda, and MakeMyTrip to prevent double-bookings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSync("all_channels", "")}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-600" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync All OTAs"}</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Connected OTAs
          </div>
          <div className="text-2xl font-black text-gray-900">
            {channels.filter((c) => c.syncStatus === "connected").length} / {channels.length}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Live calendar connections</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Total Channel Bookings
          </div>
          <div className="text-2xl font-black text-blue-600">{totalChannelBookings}</div>
          <div className="text-[11px] text-gray-500 mt-1">Direct & OTA combined</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Channel Revenue
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatCurrency(totalChannelRevenue)}</div>
          <div className="text-[11px] text-gray-500 mt-1">Gross revenue from channels</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Calendar Conflict Protection
          </div>
          <div className="text-sm font-black text-purple-600 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-4 h-4" /> 100% Protected
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Instant room auto-block</div>
        </div>
      </div>

      {/* Channel Connections Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            Active OTA Connections
          </h2>
          <span className="text-xs text-gray-400">Pushes room availability in &lt; 2 seconds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map((channel) => {
            const theme = CHANNEL_THEMES[channel.channelName] || {
              bg: "bg-gray-50 border-gray-200",
              text: "text-gray-700",
              icon: "🏨",
            };

            return (
              <div
                key={channel.channelName}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-gray-200 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl border ${theme.bg} flex items-center justify-center text-xl shadow-2xs`}>
                        {theme.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">{channel.displayName}</h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            channel.syncStatus === "connected"
                              ? "bg-emerald-50 text-emerald-700"
                              : channel.syncStatus === "paused"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {channel.syncStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Inventory Sync</span>
                      <span className="font-bold text-gray-800">
                        {channel.syncInventory ? "✓ Enabled" : "— Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Rates Sync</span>
                      <span className="font-bold text-gray-800">
                        {channel.syncRates ? "✓ Enabled" : "— Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Channel ID</span>
                      <span className="font-mono text-[11px] text-gray-700">
                        {channel.propertyChannelId || "Auto-assigned"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSync(channel.channelName, channel.id)}
                      disabled={isSyncing}
                      className="py-1.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sync</span>
                    </button>
                    <button
                      onClick={() => setSelectedChannel(channel)}
                      className="py-1.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Settings2 className="w-3 h-3" />
                      <span>Config</span>
                    </button>
                  </div>

                  {/* Simulate booking button */}
                  <button
                    onClick={() => handleImportBooking(channel.channelName)}
                    disabled={isImporting}
                    className="w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <DownloadCloud className="w-3 h-3 text-blue-600" />
                    <span>Simulate Inbound Booking</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel Distribution & Sync Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Channel Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">Bookings by Channel</h3>
            <span className="text-xs text-gray-400">Distribution of stay sources</span>
          </div>

          <div className="space-y-3">
            {distribution.map((d) => (
              <div key={d.channel} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">{d.displayName}</span>
                  <span className="text-gray-500 font-medium">
                    {d.count} bookings &bull; {formatCurrency(d.revenue)} ({d.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.max(5, d.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Audit Feed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">Recent Sync Audit Log</h3>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {syncLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Click &quot;Sync&quot; above to push room inventory and generate live sync events.
              </div>
            ) : (
              syncLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 capitalize">{log.channelName}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5 truncate">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Configure Channel Modal */}
      {selectedChannel && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">
                Configure {selectedChannel.displayName} Integration
              </h3>
              <button
                onClick={() => setSelectedChannel(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <input type="hidden" name="channel_name" value={selectedChannel.channelName} />
              <input type="hidden" name="display_name" value={selectedChannel.displayName} />

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Property Channel ID / Listing ID
                </label>
                <input
                  type="text"
                  name="property_channel_id"
                  defaultValue={selectedChannel.propertyChannelId || ""}
                  placeholder="e.g. AB-8492019"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  API Key / OAuth Token
                </label>
                <input
                  type="password"
                  name="api_key"
                  defaultValue="••••••••••••••••"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 text-gray-800"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="true"
                    defaultChecked={selectedChannel.isActive}
                    className="rounded text-blue-600"
                  />
                  <span>Active Connection</span>
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    name="sync_inventory"
                    value="true"
                    defaultChecked={selectedChannel.syncInventory}
                    className="rounded text-blue-600"
                  />
                  <span>Sync Room Availability</span>
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    name="sync_rates"
                    value="true"
                    defaultChecked={selectedChannel.syncRates}
                    className="rounded text-blue-600"
                  />
                  <span>Sync Base Rates &amp; Charges</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedChannel(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-5 py-2 bg-[#0b1437] hover:bg-[#162268] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

