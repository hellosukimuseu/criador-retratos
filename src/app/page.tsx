"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [pets, setPets] = useState<any[]>([]);

  // 🔹 Buscar imagens do banco
  async function fetchPets() {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pets:", error);
      return;
    }

    if (data) {
      setPets(data);
    }
  }

  useEffect(() => {
    fetchPets();
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

    // 3️⃣ Salvar no banco
    const { error: dbError } = await supabase.from("pets").insert({
      image_url: publicUrl,
      status: "uploaded",
    });

    if (dbError) {
      console.error("DB error:", dbError);
    }

    setUrl(publicUrl);
    setUploading(false);

    // 4️⃣ Atualizar galeria
    fetchPets();
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

      <hr style={{ margin: "40px 0" }} />

      <h2>Galeria</h2>

      {pets.map((pet) => (
        <div key={pet.id} style={{ marginBottom: 20 }}>
          <img src={pet.image_url} width={200} />
        </div>
      ))}
    </main>
  );
}