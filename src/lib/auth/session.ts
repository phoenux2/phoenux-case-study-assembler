import { getDataMode } from "@/lib/config";
import { getLocalProfile, getLocalUserId } from "@/lib/local/store";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db/types";

export type SessionUser = {
  id: string;
  email: string | null;
  profile: Profile;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (getDataMode() === "local") {
    const profile = await getLocalProfile();
    return {
      id: getLocalUserId(),
      email: profile.email,
      profile,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    profile: profile ?? {
      id: user.id,
      email: user.email ?? null,
      display_name: user.email?.split("@")[0] ?? "User",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
