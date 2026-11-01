export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Test if DB is connected - for /admin route
    if (url.pathname === "/admin" || url.pathname.startsWith("/api/")) {
      try {
        const { results } = await env.DB.prepare("SELECT * FROM users").all();
        return new Response(JSON.stringify({
          success: true,
          message: "✅ Bixberry Admin Connected!",
          admin_email: "admin@bixberry.com",
          users: results
        }, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response("DB Error: " + err.message + "\n\nGo to Cloudflare Dashboard > bixberry Worker > Settings > Variables > Add D1 binding: DB -> bixberry-db", { status: 500 });
      }
    }
    
    // For everything else, serve your site
    return env.ASSETS.fetch(request);
  }
}
