import express from "express";
import path from "path";
import fs from "fs/promises";
import { app } from "./src/serverApp";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  const isProd = process.env.NODE_ENV === "production";
  console.log(`[SERVER] Initializing in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

  if (!isProd) {
    try {
      console.log("[SERVER] Setting up Vite middleware...");
      const { createServer: createViteServer } = await import("vite");
      
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false 
        },
        appType: "spa",
        root: process.cwd(),
      });
      
      app.use(vite.middlewares);
      
      // SPA Fallback for dev
      app.get('*', async (req, res, next) => {
        if (req.url.startsWith('/api') || (req.url.includes('.') && !req.url.endsWith('.html'))) {
          return next();
        }
        
        try {
          const template = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
          const html = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } catch (e) {
          console.error("[SERVER] Vite SPA Fallback Error:", e);
          res.status(500).end(String(e));
        }
      });

      console.log("[SERVER] Vite middleware ready.");
    } catch (err) {
      console.error("[SERVER] Failed to initialize Vite:", err);
    }
  }

  if (isProd) {
    console.log("[SERVER] Serving static files from dist...");
    const distPath = path.join(process.cwd(), "dist");
    
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: false,
    }));
    
    app.get("*", (req, res, next) => {
      if (req.url.startsWith('/api')) return next();
      if (path.extname(req.url) && req.url !== '/') {
        return next();
      }
      
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          console.error("[SERVER] Failed to send index.html:", err);
          res.status(500).end("Server error");
        }
      });
    });
    console.log("[SERVER] Production mode ready.");
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("SERVER ERROR:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SERVER: Listening at http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error("SERVER: Fatal start error:", err);
  process.exit(1);
});
