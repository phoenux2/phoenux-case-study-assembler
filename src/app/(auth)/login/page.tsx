import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getAppName, getDataMode } from "@/lib/config";

export default function LoginPage() {
  if (getDataMode() === "local") {
    redirect("/projects");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 bg-[radial-gradient(ellipse_at_top,_var(--muted)_0%,_var(--background)_55%)] px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-heading text-2xl font-semibold tracking-tight">
          {getAppName()}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Assemble evidence into reusable case studies — AI optional.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
