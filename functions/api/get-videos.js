export async function onRequest(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const searchQuery = searchParams.get('search') || '';

    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ success: false, message: 'Kredensial Supabase belum diatur di Cloudflare.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 🎯 AMBIL SEMUA DATA (Menghapus &limit=500 agar menarik seluruh database)
    let queryParams = 'select=id,title,videy_id&order=id.desc';
    if (searchQuery) {
      queryParams += `&title=ilike.*${encodeURIComponent(searchQuery)}*`;
    }

    const url1 = `${supabaseUrl}/rest/v1/videos1?${queryParams}`;
    const url2 = `${supabaseUrl}/rest/v1/videos2?${queryParams}`;

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    // Jalankan fetch paralel ke kedua tabel
    const [res1, res2] = await Promise.all([
      fetch(url1, { headers }).catch(() => null),
      fetch(url2, { headers }).catch(() => null)
    ]);

    let data1 = [];
    let data2 = [];

    if (res1 && res1.ok) {
      const json1 = await res1.json();
      data1 = json1.map(item => ({ ...item, origin_table: 'videos1' }));
    }

    if (res2 && res2.ok) {
      const json2 = await res2.json();
      data2 = json2.map(item => ({ ...item, origin_table: 'videos2' }));
    }

    // Gabungkan kedua data tabel mentah
    let combinedData = [...data1, ...data2];

    // 🎯 LOGIKA SORTIR KESAYANGAN:
    // Utamakan videos2 di atas videos1. Jika sesama tabel, urutkan berdasarkan ID terbesar (terbaru).
    combinedData.sort((a, b) => {
      if (a.origin_table === 'videos2' && b.origin_table === 'videos1') {
        return -1; // a (videos2) naik ke atas
      }
      if (a.origin_table === 'videos1' && b.origin_table === 'videos2') {
        return 1;  // b (videos2) naik ke atas
      }
      // Jika berasal dari tabel yang sama, sortir berdasarkan ID terbesar (terbaru)
      return b.id - a.id;
    });

    return new Response(JSON.stringify({ success: true, data: combinedData }), {
      headers: {
        'Content-Type': 'application/json',
        // Menyimpan di cache Cloudflare selama 10 menit biar loading bulk instan & gak membebani Supabase/Workers
        'Cache-Control': 'public, max-age=600, s-maxage=600'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
