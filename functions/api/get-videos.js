export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const search = searchParams.get('search') || '';

  // Mengambil kredensial Supabase secara rahasia dari Environment Variables Cloudflare
  const SUPABASE_URL = context.env.SUPABASE_URL;
  const SUPABASE_KEY = context.env.SUPABASE_KEY;

  // Jika variabel belum di-set di Cloudflare, return error biar gampang didebug
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ success: false, message: 'Kredensial Supabase belum diatur di Cloudflare.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Menyusun URL query REST API bawaan Supabase untuk tabel videos2
  let url = `${SUPABASE_URL}/rest/v1/videos2?select=id,title,videy_id&order=id.desc&limit=50`;
  
  // Jika kamu mengetik sesuatu di kolom search, tambahkan filter ilike (pencarian acak huruf besar/kecil)
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
