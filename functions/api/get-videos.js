export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const search = searchParams.get('search') || '';

  // Mengambil URL dan KEY Supabase langsung dari Environment Variables Cloudflare
  const SUPABASE_URL = context.env.SUPABASE_URL;
  const SUPABASE_KEY = context.env.SUPABASE_KEY;

  // Struktur query REST API bawaan Supabase untuk tabel videos2
  let url = `${SUPABASE_URL}/rest/v1/videos2?select=id,title,videy_id&order=id.desc&limit=50`;
  
  // Jika ada teks pencarian, filter berdasarkan title (case-insensitive)
  if (search) {
    url += `&title=ilike.*${encodeURIComponent(search)}*`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
