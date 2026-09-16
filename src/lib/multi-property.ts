import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PropertySummary {
  id: string;
  name: string;
  subdomain: string;
  address: string | null;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  totalBilled: number;
  totalReceived: number;
  totalBalance: number;
  staffCount: number;
  isCurrent: boolean;
}

export interface OrganizationStaffMember {
  id: string;
  fullName: string;
  role: string;
  lodgeId: string;
  lodgeName: string;
  createdAt: string;
}

export interface MultiPropertyData {
  organization: {
    id: string;
    name: string;
    role: string;
  };
  properties: PropertySummary[];
  portfolioSummary: {
    totalProperties: number;
    totalRooms: number;
    totalOccupied: number;
    portfolioOccupancyRate: number;
    totalBilled: number;
    totalReceived: number;
    totalBalance: number;
    collectionRate: number;
  };
  staffMembers: OrganizationStaffMember[];
}

/**
 * Fetch multi-property organization portfolio and performance metrics
 */
export async function getMultiPropertyData(
  currentLodgeId: string,
  userId: string
): Promise<MultiPropertyData> {
  const admin = createAdminClient();

  // 1. Check current lodge
  const { data: currentLodge } = await (admin as any)
    .from("lodges")
    .select("id, name, subdomain, address, organization_id, owner_user_id")
    .eq("id", currentLodgeId)
    .single();

  let orgId = currentLodge?.organization_id;
  let orgName = "Alpine Hospitality Portfolio";

  // Check user_organizations if table exists
  try {
    if (orgId) {
      const { data: orgData } = await (admin as any)
        .from("user_organizations")
        .select("id, organization_name, role")
        .eq("id", orgId)
        .single();
      if (orgData) {
        orgName = orgData.organization_name;
      }
    } else {
      const { data: userOrg } = await (admin as any)
        .from("user_organizations")
        .select("id, organization_name, role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (userOrg) {
        orgId = userOrg.id;
        orgName = userOrg.organization_name;
      }
    }
  } catch {
    // Graceful fallback if user_organizations table is pending migration
  }

  // 2. Fetch all properties belonging to organization, or all demo sister lodges
  let lodgesList: any[] = [];
  if (orgId) {
    const { data } = await (admin as any)
      .from("lodges")
      .select("id, name, subdomain, address")
      .eq("organization_id", orgId);
    if (data && data.length > 0) lodgesList = data;
  }

  // If no lodges linked by orgId yet, group the primary test lodges (Pinecrest & Lakeside)
  if (lodgesList.length === 0) {
    const { data: allLodges } = await (admin as any)
      .from("lodges")
      .select("id, name, subdomain, address")
      .in("subdomain", ["pinecrest", "lakeside", currentLodge?.subdomain || "pinecrest"]);
    lodgesList = allLodges || [];
  }

  // Ensure current lodge is in list
  if (!lodgesList.some((l) => l.id === currentLodgeId) && currentLodge) {
    lodgesList.unshift(currentLodge);
  }

  // 3. For each property, calculate live operational & financial metrics
  const properties: PropertySummary[] = [];
  const staffMembers: OrganizationStaffMember[] = [];

  for (const lodge of lodgesList) {
    // Rooms
    const { data: rooms } = await (admin as any)
      .from("rooms")
      .select("id, status")
      .eq("lodge_id", lodge.id);

    const totalRooms = rooms?.length || 0;
    const occupiedRooms = rooms?.filter((r: any) => r.status === "occupied").length || 0;
    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Bills & Revenue
    const { data: bills } = await (admin as any)
      .from("bills")
      .select("net_amount, received, balance")
      .eq("lodge_id", lodge.id);

    const totalBilled = bills?.reduce((acc: number, b: any) => acc + (Number(b.net_amount) || 0), 0) || 0;
    const totalReceived = bills?.reduce((acc: number, b: any) => acc + (Number(b.received) || 0), 0) || 0;
    const totalBalance = bills?.reduce((acc: number, b: any) => acc + (Number(b.balance) || 0), 0) || 0;

    // Staff
    const { data: staff } = await (admin as any)
      .from("profiles")
      .select("id, full_name, role, created_at")
      .eq("lodge_id", lodge.id);

    const staffCount = staff?.length || 0;

    if (staff) {
      staff.forEach((s: any) => {
        staffMembers.push({
          id: s.id,
          fullName: s.full_name,
          role: s.role,
          lodgeId: lodge.id,
          lodgeName: lodge.name,
          createdAt: s.created_at,
        });
      });
    }

    properties.push({
      id: lodge.id,
      name: lodge.name,
      subdomain: lodge.subdomain,
      address: lodge.address,
      totalRooms,
      occupiedRooms,
      availableRooms,
      occupancyRate,
      totalBilled,
      totalReceived,
      totalBalance,
      staffCount,
      isCurrent: lodge.id === currentLodgeId,
    });
  }

  // 4. Portfolio aggregate totals
  const totalProperties = properties.length;
  const portfolioRooms = properties.reduce((acc, p) => acc + p.totalRooms, 0);
  const portfolioOccupied = properties.reduce((acc, p) => acc + p.occupiedRooms, 0);
  const portfolioOccupancyRate =
    portfolioRooms > 0 ? Math.round((portfolioOccupied / portfolioRooms) * 100) : 0;
  const portfolioBilled = properties.reduce((acc, p) => acc + p.totalBilled, 0);
  const portfolioReceived = properties.reduce((acc, p) => acc + p.totalReceived, 0);
  const portfolioBalance = properties.reduce((acc, p) => acc + p.totalBalance, 0);
  const collectionRate =
    portfolioBilled > 0 ? Math.round((portfolioReceived / portfolioBilled) * 100) : 0;

  return {
    organization: {
      id: orgId || "org_default",
      name: orgName,
      role: "Owner",
    },
    properties,
    portfolioSummary: {
      totalProperties,
      totalRooms: portfolioRooms,
      totalOccupied: portfolioOccupied,
      portfolioOccupancyRate,
      totalBilled: portfolioBilled,
      totalReceived: portfolioReceived,
      totalBalance: portfolioBalance,
      collectionRate,
    },
    staffMembers,
  };
}

