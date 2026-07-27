import { Badge } from "@/components/ui/badge";
import { isAiEnabled } from "@/lib/ai/config";
import { getDataMode } from "@/lib/config";
import { figmaStatus } from "@/lib/services/figma";

export function SystemStatus() {
  const mode = getDataMode();
  const ai = isAiEnabled();
  const figma = figmaStatus();

  return (
    <div className="flex flex-wrap gap-2" aria-label="System status">
      <Badge variant="secondary">
        Data: {mode === "local" ? "local .data/" : "Supabase"}
      </Badge>
      <Badge variant={ai ? "default" : "outline"}>
        AI: {ai ? "enabled" : "deterministic fallbacks"}
      </Badge>
      <Badge variant={figma.configured ? "default" : "outline"}>
        Figma: {figma.configured ? "API" : "stub"}
      </Badge>
    </div>
  );
}
