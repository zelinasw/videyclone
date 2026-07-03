export async function onRequestPost(context) {
  try {
    const { videoIds, includeTitle } = await context.request.json();
    if (!videoIds || videoIds.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Tidak ada video yang dipilih' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mendeteksi domain Cloudflare Pages kamu secara otomatis
    const url = new URL(context.request.url);
    const currentDomain = `${url.protocol}//${url.host}`;

    const generatedLinks = videoIds.map(video => {
      // Memastikan format output mengarah ke file video.html secara statis
      const link = `${currentDomain}/video?id=${video.videy_id}`;
      return includeTitle ? `${video.title}\n${link}` : link;
    });

    return new Response(JSON.stringify({ success: true, links: generatedLinks.join('\n\n') }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
