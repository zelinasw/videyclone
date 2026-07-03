export async function onRequest(context) {
  try {
    // 1. Ambil parameter search dari URL (jika ada)
    const { searchParams } = new URL(context.request.url);
    const searchQuery = searchParams.get('search') || '';

    // 2. Ambil URL dan API Key Supabase dari Environment Variables Cloudflare kamu
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ success: false, message: 'Kredensial Supabase belum diatur di Cloudflare.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Susun query URL untuk mencari judul video
    let queryParams = 'select=id,title,videy_id&order=id.desc&limit=500';
    if (searchQuery) {
      // Jika pengguna mengetik sesuatu di kolom search, filter berdasarkan judul (ilike = case-insensitive)
      queryParams += `&title=ilike.*${encodeURIComponent(searchQuery)}*`;
    }

    const url1 = `${supabaseUrl}/rest/v1/videos1?${queryParams}`;
    const url2 = `${supabaseUrl}/rest/v1/videos2?${queryParams}`;

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    // 4. Lakukan fetch secara bersamaan (Paralel) agar loading cepat
    const [res1, res2] = await Promise.all([
      fetch(url1, { headers }).catch(() => null),
      fetch(url2, { headers }).catch(() => null)
    ]);

    let data1 = [];
    let data2 = [];

    // Ambil data tabel videos1 jika sukses
    if (res1 && res1.ok) {
      const json1 = await res1.json();
      // Tandai asal tabelnya agar frontend bisa membedakan
      data1 = json1.map(item => ({ ...item, origin_table: 'videos1' }));
    }

    // Ambil data tabel videos2 jika sukses
    if (res2 && res2.ok) {
      const json2 = await res2.json();
      // Tandai asal tabelnya agar frontend bisa membedakan
      data2 = json2.map(item => ({ ...item, origin_table: 'videos2' }));
    }

    // 5. GABUNGKAN KEDUA TABEL MENJADI SATU ARRAY 🎯
    let combinedData = [...data1, ...data2];

    // Urutkan ulang berdasarkan ID terbesar (terbaru) agar datanya tidak numpuk per tabel
    combinedData.sort((a, b) => b.id - a.id);

    return new Response(JSON.stringify({ success: true, data: combinedData }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
