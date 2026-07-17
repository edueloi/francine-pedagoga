import { useCallback, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export type UploadCategory = "clinic" | "documents" | "avatars";

// authFetch (see AuthContext) only force-sets a JSON Content-Type when the body is a
// plain string, and explicitly skips that for FormData bodies — so it is safe to reuse
// here; the browser will set the correct multipart/form-data boundary itself.
export function useFileUpload() {
  const { authFetch } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (category: UploadCategory, file: File): Promise<string> => {
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await authFetch(`/api/uploads/${category}`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Falha ao enviar arquivo");
        }
        const data = await res.json();
        return data.url as string;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [authFetch]
  );

  return { uploadFile, uploading, error };
}
