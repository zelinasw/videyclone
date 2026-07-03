export async function onRequestPost(context) {
  try {
    const { videoIds, includeTitle } = await context.request.json();
    if (!videoIds || videoIds.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Tidak ada video dipilih' }), { status: 400 });
    }

    // Mengambil domain web clone yang sedang aktif saat ini secara otomatis
    const url = new URL(context.request.url);
    const currentDomain = `${url.protocol}//${url.host}`;

    const generatedLinks = videoIds.map(video => {
      // Format link diarahkan ke halaman player video.html statis bawaan kita
      const link = `${currentDomain}/video.html?id=${video.videy_id}`;
      return includeTitle ? `${video.title}\n${link}` : link;
    });

    return new Response(JSON.stringify({ success: true, links: generatedLinks.join('\n\n') }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
  }
}
