// functions/api/image-proxy.js - Cloudflare Pages Function (100% MoonTV Spec)
export async function onRequest(context) {
    const { request } = context;
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new Response(JSON.stringify({ error: 'Missing image URL' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const imageResponse = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://movie.douban.com/',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
        });

        if (!imageResponse.ok) {
            return new Response(`Image fetch failed: ${imageResponse.statusText}`, {
                status: imageResponse.status,
            });
        }

        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

        if (!imageResponse.body) {
            return new Response(JSON.stringify({ error: 'Image response has no body' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=15720000, s-maxage=15720000');
        headers.set('CDN-Cache-Control', 'public, s-maxage=15720000');

        // 直接輸出二進位串流 (Stream Body - 與 MoonTV 100% 一致)
        return new Response(imageResponse.body, {
            status: 200,
            headers,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
