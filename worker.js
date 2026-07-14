export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // معالجة الـ endpoints المحلية
    
    // 1. Time Sync Endpoint
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

    // 2. gRPC Handshake Endpoint
    if (pathname === '/v2ray-grpc/grpc-handshake') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          return new Response(JSON.stringify({
            ok: true,
            server: {
              sni: 'stc.com.sa',
              address: 'vpn-server-production-7b23.up.railway.app',
              port: 443
            },
            uuid: body.uuid,
            isp: body.isp,
            message: 'gRPC handshake successful'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            ok: false,
            error: error.message
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // 3. Multi-ISP Status Endpoint
    if (pathname === '/v2ray-grpc/multi-isp-status') {
      return new Response(JSON.stringify({
        ok: true,
        isps: {
          stc: { active: true, latency: 45, connected: true },
          orange: { active: true, latency: 52, connected: true },
          etisalat: { active: true, latency: 48, connected: true },
          mobily: { active: true, latency: 50, connected: true }
        },
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. FakeDNS Config Endpoint
    if (pathname === '/v2ray-grpc/fakedns-config') {
      return new Response(JSON.stringify({
        ok: true,
        fakedns: {
          enabled: true,
          pools: [
            { ip: '198.18.0.0/15', size: 65535 }
          ]
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Forward other requests to Railway server
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
