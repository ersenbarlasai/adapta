"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleTenantStatus(tenantId: string, currentStatus: boolean) {
  const supabase = await createClient();
  
  // Security Check: Verify Super Admin
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", user?.id).single();
  
  if (!profile?.is_super_admin) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("tenants")
    .update({ is_active: !currentStatus })
    .eq("id", tenantId);

  if (error) throw error;
  
  revalidatePath("/super-admin/tenants");
  revalidatePath(`/k/[slug]`, 'layout');
}
