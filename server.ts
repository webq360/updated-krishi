import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs/promises";
import mongoose from "mongoose";
import User from "./src/lib/models/User";
import { generateToken, verifyToken, authMiddleware, adminMiddleware } from "./src/lib/auth";
import bcryptjs from "bcryptjs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && !req.url.includes('.')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// MongoDB Connection
async function connectMongoDB() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/krishi-bondhu';
    await mongoose.connect(mongoUrl);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.log('⚠️  Make sure MongoDB is running on port 27017');
  }
}

connectMongoDB();

// Lazy AI initialization
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

// ==================== Auth Routes ====================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'user'
    });

    await user.save();

    const token = generateToken(user._id.toString(), user.email, user.role);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user._id.toString(), user.email, user.role);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

// Verify Token
app.post("/api/auth/verify", authMiddleware, (req, res) => {
  res.json({ valid: true, user: (req as any).user });
});

// Get Current User
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ==================== Admin Routes ====================

// Create Admin User
app.post("/api/admin/create-admin", adminMiddleware, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'admin'
    });

    await user.save();

    res.status(201).json({
      message: "Admin user created successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Create Admin Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

// Get All Users
app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update User Role
app.patch("/api/admin/users/:id/role", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin', 'agent'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User role updated", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete User
app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || 'development' });
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
              mimeType: mimeType
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
      history: (history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || msg.content || "" }]
      }))
    });

    let messagePayload: any = { message: prompt || "" };
    
    if (image && mimeType) {
      messagePayload.message = {
        parts: [
          { text: prompt || "Analyze this image." },
          { 
            inlineData: {
              data: image,
              mimeType: mimeType
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
  console.log(`[SERVER] Initializing in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

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
        root: process.cwd(),
      });
      console.log("[SERVER] Vite server created.");
      
      app.use(vite.middlewares);
      
      // SPA Fallback for dev - Ensure it doesn't block files with dots
      app.get('*', async (req, res, next) => {
        // Skip if it looks like a file request that Vite should have handled or a backend API
        if (req.url.startsWith('/api') || (req.url.includes('.') && !req.url.endsWith('.html'))) {
          console.log(`[SERVER] Skipping SPA fallback for asset: ${req.url}`);
          return next();
        }
        
        try {
          console.log(`[SERVER] Handling dev SPA request: ${req.url}`);
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
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.url.startsWith('/api')) return next();
      console.log(`[SERVER] Handling production SPA request: ${req.url}`);
      res.sendFile(path.join(distPath, "index.html"));
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


