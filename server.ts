import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa", 
    });
    app.use(vite.middlewares);
    
    // Explicit route handling for dev sections
    app.get(["/about", "/about.html"], async (req, res, next) => {
      try {
        const html = await vite.transformIndexHtml("/about.html", "/about.html");
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.get(["/curriculum", "/curriculum.html"], async (req, res, next) => {
      try {
        const html = await vite.transformIndexHtml("/curriculum.html", "/curriculum.html");
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.get(["/enrichment", "/enrichment.html"], async (req, res, next) => {
      try {
        const html = await vite.transformIndexHtml("/enrichment.html", "/enrichment.html");
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.get("/files", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const html = await vite.transformIndexHtml(url, "/files.html");
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get("/files", (req, res) => {
      res.sendFile(path.join(distPath, 'files.html'));
    });

    app.get("/about", (req, res) => {
      res.sendFile(path.join(distPath, 'about.html'));
    });

    app.get("/curriculum", (req, res) => {
      res.sendFile(path.join(distPath, 'curriculum.html'));
    });

    app.get("/enrichment", (req, res) => {
      res.sendFile(path.join(distPath, 'enrichment.html'));
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
