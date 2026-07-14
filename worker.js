export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // معالجة الـ endpoints المحلية أولاً
    if (pathname === '/v2ray-grpc/time-sync') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const serverTime = Date.now();
          const timeDiff = serverTime - body.clientTime;
          
          return new Response(JSON.stringify({
            synced: true,
            timeDiff: timeDiff,
            message: 'Time synced successfully',
            serverTime: serverTime
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            synced: false,
            timeDiff: 999,
            message: 'Failed to sync time'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // معالجة الـ endpoints الأخرى عن طريق forwarding
    const originUrl = new URL(request.url);
    originUrl.hostname = 'vpn-server-production-7b23.up.railway.app';
    originUrl.protocol = 'https:';

    const headers = new Headers(request.headers);
    headers.set('Host', 'vpn-server-production-7b23.up.railway.app');
    
    if (request.headers.get('content-type')?.includes('application/grpc')) {
      headers.set('content-type', 'application/grpc');
    }

    try {
      const response = await fetch(originUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.body,
        cf: {
          mirage: false,
          minify: {
            javascript: false,
            css: false,
            html: false,
          },
        },
      });

      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return newResponse;
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Proxy error',
        message: error.message,
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
