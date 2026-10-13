import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

// Uploads an icon/screenshot and returns a long-lived link to it.
export async function uploadAppImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be under 5 MB.");
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("app-media").upload(path, file, {
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  const { data, error: signError } = await supabase.storage
    .from("app-media")
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data) throw new Error(signError?.message ?? "Upload failed.");
  return data.signedUrl;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}
