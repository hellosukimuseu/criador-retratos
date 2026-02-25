"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  // 🔹 Buscar sessões
  async function fetchSessions() {
    const { data, error } = await supabase
      .from("preview_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar sessões:", error);
      return;
    }

    if (data) {
      setSessions(data);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  // 🔹 Upload
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const fileName = `${Date.now()}-${file.name}`;

    setUploading(true);

    // 1️⃣ Upload para o bucket
    const { error: uploadError } = await supabase.storage
      .from("pet-uploads")
      .upload(fileName, file);

    if (uploadError) {
      alert("Erro no upload");
      console.error(uploadError);
      setUploading(false);
      return;
    }

    // 2️⃣ Pegar URL pública
    const { data: publicData } = supabase.storage
      .from("pet-uploads")
      .getPublicUrl(fileName);

    const publicUrl = publicData.publicUrl;

    // 3️⃣ Criar sessão
    const { error: dbError } = await supabase
      .from("preview_sessions")
      .insert({
        pet_photo_url: publicUrl,
        status: "uploaded",
      });

    if (dbError) {
      console.error("DB error:", dbError);
    }

    setUploading(false);

    // 4️⃣ Atualizar lista
    fetchSessions();
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Upload do Pet</h1>

      <input type="file" onChange={handleUpload} />

      {uploading && <p>Enviando...</p>}

      <hr style={{ margin: "40px 0" }} />

      <h2>Sessões</h2>

      {sessions.map((session) => (
        <div
          key={session.id}
          style={{
            marginBottom: 30,
            padding: 20,
            border: "1px solid #333",
            borderRadius: 8,
          }}
        >
          <img
            src={session.pet_photo_url}
            width={200}
            style={{ display: "block", marginBottom: 10 }}
          />

          <strong>Status:</strong> {session.status}
        </div>
      ))}
    </main>
  );
}