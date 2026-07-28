import { Badge } from "@/components/ui/badge";
import { isAiEnabled } from "@/lib/ai/config";
import { getDataMode, isAuthBypassEnabled, isEphemeralHost } from "@/lib/config";
import { usesCookieLocalStore } from "@/lib/local/store";
import { figmaStatus } from "@/lib/services/figma";

export function SystemStatus() {
  const mode = getDataMode();
  const ai = isAiEnabled();
  const figma = figmaStatus();
  const ephemeral = isEphemeralHost();
  const cookieStore = usesCookieLocalStore();
  const authBypass = isAuthBypassEnabled();

  return (
    <div className="flex flex-wrap gap-2" aria-label="System status">
      <Badge variant="secondary">
        Data:{" "}
        {mode === "local"
          ? cookieStore
            ? "browser cookies (demo)"
            : "local .data/"
          : "Supabase"}
      </Badge>
      <Badge variant={ai ? "default" : "outline"}>
        AI: {ai ? "enabled" : "deterministic fallbacks"}
      </Badge>
      <Badge variant={figma.configured ? "default" : "outline"}>
        Figma: {figma.configured ? "API" : "stub"}
      </Badge>
      {ephemeral ? (
        <Badge variant="outline">Hosted demo persistence</Badge>
      ) : null}
      {authBypass ? (
        <Badge variant="destructive">Auth bypass ON</Badge>
      ) : null}
    </div>
  );
}
