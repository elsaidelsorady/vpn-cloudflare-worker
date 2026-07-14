export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Time Sync Endpoint
    if (path === '/v2ray-grpc/time-sync') {
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
            headers: {
              'Content-Type': 'application/grpc',
              'Cache-Control': 'no-store',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            synced: false,
            timeDiff: 999,
            message: 'Failed to sync time'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/grpc',
              'Cache-Control': 'no-store'
            }
          });
        }
      }
    }

    // 2. gRPC Handshake Endpoint
    if (path === '/v2ray-grpc/grpc-handshake') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          return new Response('gRPC Handshake OK', {
            status: 200,
            headers: {
              'Content-Type': 'application/grpc',
              'Cache-Control': 'no-store',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (error) {
          return new Response('gRPC Handshake Failed', {
            status: 400,
            headers: {
              'Content-Type': 'application/grpc',
              'Cache-Control': 'no-store'
            }
          });
        }
      }
    }

    // 3. Multi-ISP Status Endpoint
    if (path === '/v2ray-grpc/multi-isp-status') {
      const statusData = {
        status: 'online',
        can_bypass: true,
        isps: {
          stc: { active: true, latency: 45, connected: true },
          orange: { active: true, latency: 52, connected: true },
          etisalat: { active: true, latency: 48, connected: true },
          mobily: { active: true, latency: 50, connected: true }
        },
        timestamp: Date.now()
      };
      
      return new Response(JSON.stringify(statusData), {
        status: 200,
        headers: {
          'Content-Type': 'application/grpc',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 4. FakeDNS Config Endpoint
    if (path === '/v2ray-grpc/fakedns-config') {
      const fakeDnsConfig = {
        ok: true,
        fakedns: {
          enabled: true,
          pools: [
            { ip: '198.18.0.0/15', size: 65535 }
          ]
        }
      };
      
      return new Response(JSON.stringify(fakeDnsConfig), {
        status: 200,
        headers: {
          'Content-Type': 'application/grpc',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        }
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
      newResponse.headers.set('Cache-Control', 'no-store');
      
      return newResponse;
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Proxy error',
        message: error.message,
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/grpc',
          'Cache-Control': 'no-store'
        },
      });
    }
  },
};
