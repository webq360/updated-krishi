var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_promises = __toESM(require("fs/promises"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use((req, res, next) => {
  if (!req.url.startsWith("/api") && !req.url.includes(".")) {
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});
var genAI = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAI = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAI;
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { image, mimeType, prompt } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: "Image and mimeType are required" });
    }
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: {
        parts: [
          { text: prompt || "Analyze this agricultural image for any diseases or issues. Return response in JSON format if possible." },
          {
            inlineData: {
              data: image,
              mimeType
            }
          }
        ]
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { prompt, history, systemInstruction, image, mimeType } = req.body;
    if (!prompt && !image) {
      return res.status(400).json({ error: "Prompt or image is required" });
    }
    const ai = getGenAI();
    const chat = ai.chats.create({
      model: "gemini-3.1-flash-lite",
      config: {
        systemInstruction: systemInstruction || "You are a helpful agricultural expert."
      },
      history: (history || []).map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text || msg.content || "" }]
      }))
    });
    let messagePayload = { message: prompt || "" };
    if (image && mimeType) {
      messagePayload.message = {
        parts: [
          { text: prompt || "Analyze this image." },
          {
            inlineData: {
              data: image,
              mimeType
            }
          }
        ]
      };
    }
    const response = await chat.sendMessage(messagePayload);
    res.json({ text: response.text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});
async function start() {
  const isProd = process.env.NODE_ENV === "production";
  console.log(`[SERVER] Initializing in ${isProd ? "PRODUCTION" : "DEVELOPMENT"} mode`);
  const serverStartTime = Date.now();
  if (!isProd) {
    try {
      console.log("[SERVER] Setting up Vite middleware...");
      const { createServer: createViteServer } = await import("vite");
      console.log("[SERVER] Vite module imported.");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false
        },
        appType: "spa",
        root: process.cwd()
      });
      console.log("[SERVER] Vite server created.");
      app.use(vite.middlewares);
      app.get("*", async (req, res, next) => {
        if (req.url.startsWith("/api") || req.url.includes(".") && !req.url.endsWith(".html")) {
          console.log(`[SERVER] Skipping SPA fallback for asset: ${req.url}`);
          return next();
        }
        try {
          console.log(`[SERVER] Handling dev SPA request: ${req.url}`);
          const template = await import_promises.default.readFile(import_path.default.resolve(process.cwd(), "index.html"), "utf-8");
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
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.url.startsWith("/api")) return next();
      console.log(`[SERVER] Handling production SPA request: ${req.url}`);
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
    console.log("[SERVER] Production mode ready.");
  }
  app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SERVER: Listening at http://0.0.0.0:${PORT}`);
  });
}
start().catch((err) => {
  console.error("SERVER: Fatal start error:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
