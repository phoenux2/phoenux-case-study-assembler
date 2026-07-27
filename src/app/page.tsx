import { redirect } from "next/navigation";

import { getDataMode } from "@/lib/config";
import { getSessionUser } from "@/lib/auth/session";

export default async function HomePage() {
  const mode = getDataMode();
  if (mode === "local") {
    redirect("/projects");
  }

  const user = await getSessionUser();
  redirect(user ? "/projects" : "/login");
}
