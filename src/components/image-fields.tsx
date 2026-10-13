import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { uploadAppImage } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function UploadButton({ onUploaded, label }: { onUploaded: (url: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            onUploaded(await uploadAppImage(file));
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Upload failed.");
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button type="button" variant="outline" className="shrink-0 rounded-md" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {label}
      </Button>
    </>
  );
}

export function IconField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Icon</Label>
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
          {value ? (
            <img src={value} alt="Icon preview" className="size-full object-cover" />
          ) : (
            <span className="font-mono text-xs text-muted-foreground">icon</span>
          )}
        </div>
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" className="bg-card" />
        <UploadButton label="Upload" onUploaded={onChange} />
      </div>
    </div>
  );
}

export function ScreenshotsField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = (url: string) => {
    const clean = url.trim();
    if (!clean || value.includes(clean) || value.length >= 6) return;
    onChange([...value, clean]);
  };
  return (
    <div className="space-y-2">
      <Label>Screenshots (up to 6)</Label>
      {value.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url) => (
            <div key={url} className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-card">
              <img src={url} alt="Screenshot preview" className="size-full object-cover" />
              <button
                type="button"
                aria-label="Remove screenshot"
                onClick={() => onChange(value.filter((u) => u !== url))}
                className="absolute top-1.5 right-1.5 rounded-md bg-background/80 p-1 text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
              setDraft("");
            }
          }}
          placeholder="Paste an image link and press Enter"
          className="bg-card"
        />
        <UploadButton label="Upload" onUploaded={add} />
      </div>
    </div>
  );
}
