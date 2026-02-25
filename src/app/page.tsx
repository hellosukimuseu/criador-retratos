"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const fileName = `${Date.now()}-${file.name}`;

    setUploading(true);

    const { error } = await supabase.storage
      .from("pet-uploads")
      .upload(fileName, file);

    if (error) {
      alert("Erro no upload");
      console.error(error);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("pet-uploads")
      .getPublicUrl(fileName);

    setUrl(data.publicUrl);
    setUploading(false);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Upload do Pet</h1>

      <input type="file" onChange={handleUpload} />

      {uploading && <p>Enviando...</p>}

      {url && (
        <div>
          <p>Upload concluído:</p>
          <img src={url} width={300} />
        </div>
      )}
    </main>
  );
}