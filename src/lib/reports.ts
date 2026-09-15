import { createClient } from "@/lib/supabase/server";

export interface MonthlyRevenuePoint {
  month: string;
  billed: number;
  received: number;
  outstanding: number;
}

export interface DailyOccupancyPoint {
  date: string;
  occupancyRate: number;
  occupiedRooms: number;
}

export interface PaymentMethodShare {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface PaymentStatusShare {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface TopRepeatGuest {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  visits: number;
  totalSpent: number;
  lastStay: string | null;
}

export interface ReportsAggregateData {
  lodgeId: string;
  lodgeName: string;
  generatedAt: string;
  metrics: {
    totalRooms: number;
    occupiedToday: number;
    occupancyRateToday: number;
    totalBilled: number;
    totalReceived: number;
    totalOutstanding: number;
    collectionRate: number;
    totalReservations: number;
    totalGuests: number;
    repeatGuestCount: number;
    repeatGuestRate: number;
    avgStayLengthDays: number;
    cancellationRate: number;
  };
  occupancyTrend: DailyOccupancyPoint[];
  monthlyRevenue: MonthlyRevenuePoint[];
  paymentMethods: PaymentMethodShare[];
  paymentStatuses: PaymentStatusShare[];
  topRepeatGuests: TopRepeatGuest[];
}

export async function getLodgeReportsData(lodgeId: string, lodgeName: string): Promise<ReportsAggregateData> {
  const supabase = await createClient();

  // Run queries in parallel, all scoped to lodgeId
  const [
    { data: roomsData },
    { data: reservationsData },
    { data: billsData },
    { data: paymentsData },
    { data: customersData },
  ] = await Promise.all([
    (supabase as any)
      .from("rooms")
      .select("id, room_number, status, room_type")
      .eq("lodge_id", lodgeId),
    (supabase as any)
      .from("reservations")
      .select("id, check_in, check_out, guests, status, advance, created_at")
      .eq("lodge_id", lodgeId),
    (supabase as any)
      .from("bills")
      .select("id, net_amount, received, balance, payment_status, created_at")
      .eq("lodge_id", lodgeId),
    (supabase as any)
      .from("payments")
      .select("id, amount, method, paid_at")
      .eq("lodge_id", lodgeId),
    (supabase as any)
      .from("customers")
      .select("id, name, mobile, email, visits, total_spent, outstanding, last_stay")
      .eq("lodge_id", lodgeId)
      .order("visits", { ascending: false })
      .limit(10),
  ]);

  const rooms = roomsData || [];
  const reservations = reservationsData || [];
  const bills = billsData || [];
  const payments = paymentsData || [];
  const customers = customersData || [];

  const totalRooms = rooms.length || 1; // avoid division by 0
  const occupiedToday = rooms.filter((r: any) => r.status === "occupied").length;
  const occupancyRateToday = Math.round((occupiedToday / totalRooms) * 100);

  // Revenue sums
  let totalBilled = 0;
  let totalReceived = 0;
  let totalOutstanding = 0;

  const statusMap: Record<string, { count: number; amount: number }> = {
    paid: { count: 0, amount: 0 },
    partial: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
  };

  bills.forEach((b: any) => {
    const net = Number(b.net_amount) || 0;
    const rec = Number(b.received) || 0;
    const bal = Number(b.balance) || 0;
    totalBilled += net;
    totalReceived += rec;
    totalOutstanding += bal;

    const st = (b.payment_status || "pending").toLowerCase();
    if (!statusMap[st]) statusMap[st] = { count: 0, amount: 0 };
    statusMap[st].count += 1;
    statusMap[st].amount += net;
  });

  const collectionRate = totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 100;

  // Payment Status share
  const paymentStatuses: PaymentStatusShare[] = Object.entries(statusMap).map(([status, item]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count: item.count,
    amount: item.amount,
    percentage: totalBilled > 0 ? Math.round((item.amount / totalBilled) * 100) : 0,
  }));

  // Payment Methods
  const methodMap: Record<string, { amount: number; count: number }> = {};
  let totalPaymentAmount = 0;
  payments.forEach((p: any) => {
    const m = p.method || "Cash";
    const amt = Number(p.amount) || 0;
    if (!methodMap[m]) methodMap[m] = { amount: 0, count: 0 };
    methodMap[m].amount += amt;
    methodMap[m].count += 1;
    totalPaymentAmount += amt;
  });

  const paymentMethods: PaymentMethodShare[] = Object.entries(methodMap).map(([method, data]) => ({
    method,
    amount: data.amount,
    count: data.count,
    percentage: totalPaymentAmount > 0 ? Math.round((data.amount / totalPaymentAmount) * 100) : 0,
  }));

  if (paymentMethods.length === 0) {
    paymentMethods.push({ method: "Cash", amount: totalReceived, count: 1, percentage: 100 });
  }

  // Guest Insights
  const totalReservations = reservations.length;
  let totalStayNights = 0;
  let completedReservationsCount = 0;
  let cancelledCount = 0;

  reservations.forEach((r: any) => {
    if (r.status === "cancelled") {
      cancelledCount++;
    } else {
      if (r.check_in && r.check_out) {
        const dIn = new Date(r.check_in);
        const dOut = new Date(r.check_out);
        const nights = Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 60 * 60 * 24)));
        totalStayNights += nights;
        completedReservationsCount++;
      }
    }
  });

  const avgStayLengthDays = completedReservationsCount > 0 ? +(totalStayNights / completedReservationsCount).toFixed(1) : 1;
  const cancellationRate = totalReservations > 0 ? Math.round((cancelledCount / totalReservations) * 100) : 0;

  const totalGuests = customers.length;
  const repeatGuests = customers.filter((c: any) => Number(c.visits) > 1);
  const repeatGuestRate = totalGuests > 0 ? Math.round((repeatGuests.length / totalGuests) * 100) : 0;

  const topRepeatGuests: TopRepeatGuest[] = customers.map((c: any) => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    email: c.email,
    visits: Number(c.visits) || 1,
    totalSpent: Number(c.total_spent) || 0,
    lastStay: c.last_stay,
  }));

  // Monthly revenue breakdown (last 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const monthlyMap = new Map<string, { billed: number; received: number; outstanding: number }>();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    monthlyMap.set(key, { billed: 0, received: 0, outstanding: 0 });
  }

  bills.forEach((b: any) => {
    const d = new Date(b.created_at || Date.now());
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    if (monthlyMap.has(key)) {
      const cur = monthlyMap.get(key)!;
      cur.billed += Number(b.net_amount) || 0;
      cur.received += Number(b.received) || 0;
      cur.outstanding += Number(b.balance) || 0;
    }
  });

  const monthlyRevenue: MonthlyRevenuePoint[] = Array.from(monthlyMap.entries()).map(([month, val]) => ({
    month,
    billed: val.billed,
    received: val.received,
    outstanding: val.outstanding,
  }));

  // 14-day Occupancy Trend
  const occupancyTrend: DailyOccupancyPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - i);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const dayLabel = `${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;

    // Count reservations overlapping targetDate
    const overlapping = reservations.filter((r: any) => {
      if (r.status === "cancelled") return false;
      return r.check_in <= dateStr && r.check_out >= dateStr;
    }).length;

    const rate = Math.min(100, Math.round((overlapping / totalRooms) * 100));
    occupancyTrend.push({
      date: dayLabel,
      occupancyRate: rate,
      occupiedRooms: overlapping,
    });
  }

  return {
    lodgeId,
    lodgeName,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalRooms: rooms.length,
      occupiedToday,
      occupancyRateToday,
      totalBilled,
      totalReceived,
      totalOutstanding,
      collectionRate,
      totalReservations,
      totalGuests,
      repeatGuestCount: repeatGuests.length,
      repeatGuestRate,
      avgStayLengthDays,
      cancellationRate,
    },
    occupancyTrend,
    monthlyRevenue,
    paymentMethods,
    paymentStatuses,
    topRepeatGuests,
  };
}

