import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Offline storage keys
const OFFLINE_QUEUE_KEY = "@lodgeos_offline_task_queue";
const CACHED_ROOMS_KEY = "@lodgeos_cached_rooms";

export default function App() {
  const [supabaseUrl, setSupabaseUrl] = useState("https://your-project.supabase.co");
  const [anonKey, setAnonKey] = useState("your-anon-key");
  const [subdomain, setSubdomain] = useState("pinecrest");
  const [email, setEmail] = useState("test-lodge-a@example.com");
  const [password, setPassword] = useState("Password123!");
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"housekeeping" | "maintenance">("housekeeping");

  const [rooms, setRooms] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  // Initialize Supabase Client
  const supabase = React.useMemo(() => {
    return createClient(supabaseUrl, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }, [supabaseUrl, anonKey]);

  // Load offline queue from local AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const queued = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (queued) setOfflineQueue(JSON.parse(queued));
      } catch (e) {
        console.warn("Error reading offline queue", e);
      }
    })();
  }, []);

  // Handle Login
  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        Alert.alert("Login Failed", error.message);
      } else {
        setSession(data.session);
        fetchStaffTasks();
      }
    } catch (err: any) {
      Alert.alert("Network Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff tasks
  const fetchStaffTasks = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      // 1. Fetch Rooms in Cleaning Queue
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("*")
        .in("status", ["cleaning", "checkout", "occupied"])
        .order("room_number", { ascending: true });

      if (roomsData) {
        setRooms(roomsData);
        await AsyncStorage.setItem(CACHED_ROOMS_KEY, JSON.stringify(roomsData));
      }

      // 2. Fetch Open Maintenance Tickets
      const { data: ticketsData } = await supabase
        .from("maintenance_tickets")
        .select("*")
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false });

      if (ticketsData) setTickets(ticketsData);
    } catch (err) {
      console.warn("Could not fetch remote tasks, reading offline cache", err);
      const cached = await AsyncStorage.getItem(CACHED_ROOMS_KEY);
      if (cached) setRooms(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  }, [session, supabase]);

  // Action: Mark Room as Cleaned (Supports Offline Queue)
  const markRoomCleaned = async (roomId: string, roomNumber: string) => {
    // Optimistic UI update
    setRooms((prev) => prev.filter((r) => r.id !== roomId));

    const taskPayload = {
      type: "MARK_ROOM_CLEANED",
      roomId,
      timestamp: new Date().toISOString(),
      roomNumber,
    };

    try {
      const { error } = await supabase
        .from("rooms")
        .update({
          status: "available",
          last_cleaned_at: new Date().toISOString(),
        })
        .eq("id", roomId);

      if (error) throw error;
      Alert.alert("Room Cleaned", `Room ${roomNumber} is now marked Available.`);
    } catch {
      // Save to offline queue if disconnected
      const updatedQueue = [...offlineQueue, taskPayload];
      setOfflineQueue(updatedQueue);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
      Alert.alert(
        "Saved Offline",
        `No connection. Room ${roomNumber} clean status queued for sync.`
      );
    }
  };

  // Action: Sync Offline Queue
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) {
      Alert.alert("All Synced", "No pending offline tasks.");
      return;
    }
    setLoading(true);
    let syncedCount = 0;
    const remaining: any[] = [];

    for (const item of offlineQueue) {
      if (item.type === "MARK_ROOM_CLEANED") {
        const { error } = await supabase
          .from("rooms")
          .update({
            status: "available",
            last_cleaned_at: item.timestamp,
          })
          .eq("id", item.roomId);

        if (!error) {
          syncedCount++;
        } else {
          remaining.push(item);
        }
      }
    }

    setOfflineQueue(remaining);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    setLoading(false);
    Alert.alert("Sync Complete", `Successfully synced ${syncedCount} offline tasks.`);
    fetchStaffTasks();
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0b1437" />
        <View style={styles.loginCard}>
          <Text style={styles.badgeText}>STAFF MOBILE COMPANION</Text>
          <Text style={styles.title}>LodgeOS Mobile</Text>
          <Text style={styles.subtitle}>On-the-ground housekeeping & maintenance</Text>

          <TextInput
            style={styles.input}
            placeholder="Subdomain (e.g. pinecrest)"
            placeholderTextColor="#94a3b8"
            value={subdomain}
            onChangeText={setSubdomain}
          />
          <TextInput
            style={styles.input}
            placeholder="Staff Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In to Lodge</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1437" />

      {/* Top Mobile Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.lodgeHeader}>{subdomain.toUpperCase()} LODGE</Text>
          <Text style={styles.staffHeader}>Logged in as Staff</Text>
        </View>
        {offlineQueue.length > 0 && (
          <TouchableOpacity style={styles.syncButton} onPress={syncOfflineQueue}>
            <Text style={styles.syncButtonText}>Sync ({offlineQueue.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "housekeeping" && styles.activeTab]}
          onPress={() => setActiveTab("housekeeping")}
        >
          <Text style={[styles.tabText, activeTab === "housekeeping" && styles.activeTabText]}>
            Housekeeping ({rooms.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "maintenance" && styles.activeTab]}
          onPress={() => setActiveTab("maintenance")}
        >
          <Text style={[styles.tabText, activeTab === "maintenance" && styles.activeTabText]}>
            Maintenance ({tickets.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      {activeTab === "housekeeping" ? (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.roomNumberText}>Room {item.room_number}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.roomTypeText}>{item.room_type || "Deluxe Suite"}</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => markRoomCleaned(item.id, item.room_number)}
              >
                <Text style={styles.actionButtonText}>✓ Mark Room Cleaned</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>All assigned rooms are clean!</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.roomNumberText}>{item.issue_type.toUpperCase()}</Text>
                <View style={styles.priorityPill}>
                  <Text style={styles.priorityPillText}>{item.priority.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.ticketDesc}>{item.description}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No open maintenance tickets.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loginCard: {
    margin: 20,
    marginTop: 80,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#2563eb",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: "900", color: "#0b1437" },
  subtitle: { fontSize: 13, color: "#64748b", marginBottom: 24 },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#0b1437",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#0b1437",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  topBar: {
    backgroundColor: "#0b1437",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lodgeHeader: { color: "#fff", fontSize: 16, fontWeight: "900" },
  staffHeader: { color: "#94a3b8", fontSize: 12 },
  syncButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#2563eb" },
  tabText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  activeTabText: { color: "#2563eb", fontWeight: "800" },
  listContent: { padding: 16 },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  taskHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  roomNumberText: { fontSize: 16, fontWeight: "800", color: "#0b1437" },
  statusPill: { backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { color: "#d97706", fontSize: 10, fontWeight: "800" },
  priorityPill: { backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityPillText: { color: "#dc2626", fontSize: 10, fontWeight: "800" },
  roomTypeText: { fontSize: 12, color: "#64748b", marginBottom: 14 },
  ticketDesc: { fontSize: 13, color: "#334155", lineHeight: 18 },
  actionButton: {
    backgroundColor: "#10b981",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
});

