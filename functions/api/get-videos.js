export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const search = searchParams.get('search') || '';

  const SUPABASE_URL = context.env.SUPABASE_URL;
  const SUPABASE_KEY = context.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ success: false, message: 'Kredensial Supabase belum diatur di Cloudflare.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 1. Susun URL query untuk tabel videos1 dan videos2
  let url1 = `${SUPABASE_URL}/rest/v1/videos1?select=id,title,videy_id&order=id.desc&limit=500`;
  let url2 = `${SUPABASE_URL}/rest/v1/videos2?select=id,title,videy_id&order=id.desc&limit=500`;
  
  // Jika ada keyword pencarian, terapkan ke kedua URL
  if (search) {
    const searchFilter = `&title=ilike.*${encodeURIComponent(search)}*`;
    url1 += searchFilter;
    url2 += searchFilter;
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // 2. Ambil data dari kedua tabel secara bersamaan (Parallel Fetch) biar cepat
    const [res1, res2] = await Promise.all([
      fetch(url1, { method: 'GET', headers }),
      fetch(url2, { method: 'GET', headers })
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    // 3. Tandai asal tabelnya agar di frontend kelihatan jelas, lalu gabungkan
    const formattedData1 = Array.isArray(data1) ? data1.map(v => ({ ...v, origin_table: 'videos1' })) : [];
    const formattedData2 = Array.isArray(data2) ? data2.map(v => ({ ...v, origin_table: 'videos2' })) : [];

    // Gabungkan data dari videos1 dan videos2
    let combinedData = [...formattedData1, ...formattedData2];

    // 4. Urutkan hasil gabungan berdasarkan ID terbesar (terbaru) secara keseluruhan
    combinedData.sort((a, b) => b.id - a.id);

    return new Response(JSON.stringify({ success: true, data: combinedData }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
