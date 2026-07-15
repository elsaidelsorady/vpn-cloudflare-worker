export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/v2ray-grpc/grpc-handshake') {
      return new Response('gRPC Handshake OK', {
        status: 200,
        headers: { 'Content-Type': 'application/grpc', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
      });
    }

    if (path === '/v2ray-grpc/multi-isp-status') {
      const statusData = { status: "online", can_bypass: true, timestamp: Date.now() };
      return new Response(JSON.stringify(statusData), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (path === '/v2ray-grpc/time-sync') {
      try {
        const body = await request.json();
        const serverTime = Date.now();
        const timeDiff = serverTime - body.clientTime;
        return new Response(JSON.stringify({ synced: true, timeDiff: timeDiff, message: 'Time synced successfully', serverTime: serverTime }), {
          status: 200,
          headers: { 'Content-Type': 'application/grpc', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ synced: false, timeDiff: 999, message: 'Failed to sync time' }), {
          status: 400,
          headers: { 'Content-Type': 'application/grpc', 'Cache-Control': 'no-store' }
        });
      }
    }

    if (path === '/v2ray-grpc/fakedns-config') {
      const fakeDnsConfig = { enabled: true, pool: "198.18.0.0/15", excludeDomain: [] };
      return new Response(JSON.stringify(fakeDnsConfig), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    return new Response('Cloudflare Pages VPN Node Active', { status: 200 });
  }
};
