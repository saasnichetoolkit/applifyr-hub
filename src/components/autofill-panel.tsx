import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImageUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { suggestAppDetails, type AppSuggestion } from "@/lib/autofill.functions";
import { fileToDataUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";

type Props = {
  url: string;
  onSuggest: (suggestion: AppSuggestion) => void;
};

export function AutofillPanel({ url, onSuggest }: Props) {
  const suggest = useServerFn(suggestAppDetails);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function run(image?: string) {
    const link = url.trim();
    if (!link && !image) {
      toast.error("Enter the website URL first, or upload a screenshot.");
      return;
    }
    setBusy(true);
    try {
      const result = await suggest({ data: { ...(link ? { url: link } : {}), ...(image ? { image } : {}) } });
      onSuggest(result);
      toast.success("Suggestions filled in. Check them before sending.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auto-fill failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      <p className="text-sm text-foreground">
        <Sparkles className="mr-1.5 inline size-4 text-accent" />
        Auto-fill name, tagline, description and category from the website or a screenshot.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" className="rounded-md" disabled={busy} onClick={() => run()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {busy ? "Reading…" : "Auto-fill from URL"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (file.size > 4 * 1024 * 1024) return toast.error("Use an image under 4 MB.");
            run(await fileToDataUrl(file));
          }}
        />
        <Button type="button" size="sm" variant="outline" className="rounded-md" disabled={busy} onClick={() => fileRef.current?.click()}>
          <ImageUp className="size-4" />
          Auto-fill from screenshot
        </Button>
      </div>
    </div>
  );
}
