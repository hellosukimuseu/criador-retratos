"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  async function fetchSessions() {
    const { data, error } = await supabase
      .from("preview_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSessions(data);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    const fileName = `${Date.now()}-${file.name}`;

    setUploading(true);

    const { error: uploadError } = await supabase.storage
      .from("pet-uploads")
      .upload(fileName, file);

    if (uploadError) {
      alert("Erro no upload");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("pet-uploads")
      .getPublicUrl(fileName);

    await supabase.from("preview_sessions").insert({
      pet_photo_url: data.publicUrl,
      status: "uploaded",
    });

    setUploading(false);
    fetchSessions();
  }

  async function generatePreview(id: string) {
    // 1️⃣ muda para processing
    await supabase
      .from("preview_sessions")
      .update({ status: "processing" })
      .eq("id", id);

    fetchSessions();

    // 2️⃣ simula tempo de processamento
    setTimeout(async () => {
      await supabase
        .from("preview_sessions")
        .update({ status: "ready" })
        .eq("id", id);

      fetchSessions();
    }, 3000);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Criador de Retratos</h1>

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

          <p>
            <strong>Status:</strong> {session.status}
          </p>

          {session.status === "uploaded" && (
  <button
    onClick={() => generatePreview(session.id)}
    style={{
      padding: "8px 16px",
      background: "#2563eb",
      color: "white",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
      marginTop: 10,
    }}
  >
    Gerar Preview
  </button>
)}

          {session.status === "processing" && <p>Gerando preview...</p>}

          {session.status === "ready" && (
            <p style={{ color: "green" }}>Preview pronto</p>
          )}
        </div>
      ))}
    </main>
  );
}