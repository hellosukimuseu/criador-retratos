import { supabase } from "../src/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase.storage
    .from("previews")
    .list();

  return (
    <main style={{ padding: 40 }}>
      <h1>Criador de Retratos</h1>
      <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
    </main>
  );
}