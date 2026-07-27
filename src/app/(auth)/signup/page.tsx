import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { getAppName, getDataMode } from "@/lib/config";

export default function SignupPage() {
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
          Create an account to start reconstructing projects.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
