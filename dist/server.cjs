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
var import_mongoose2 = __toESM(require("mongoose"), 1);

// src/lib/models/User.ts
var import_mongoose = __toESM(require("mongoose"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var userSchema = new import_mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
      // Don't include password by default
    },
    firstName: {
      type: String,
      default: ""
    },
    lastName: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: ["user", "admin", "agent"],
      default: "user"
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await import_bcryptjs.default.genSalt(10);
    this.password = await import_bcryptjs.default.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
userSchema.methods.comparePassword = async function(password) {
  return import_bcryptjs.default.compare(password, this.password);
};
var User = import_mongoose.default.model("User", userSchema);
var User_default = User;

// src/lib/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var generateToken = (userId, email, role) => {
  const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
  return import_jsonwebtoken.default.sign(
    { id: userId, email, role },
    jwtSecret,
    { expiresIn: "7d" }
  );
};
var verifyToken = (token) => {
  try {
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    return import_jsonwebtoken.default.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
};
var authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
};
var adminMiddleware = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// server.ts
import_dotenv.default.config();
function validateEnvironment() {
  const errors = [];
  const requiredVars = [
    "MONGODB_URI",
    "JWT_SECRET",
    "GEMINI_API_KEY"
  ];
  requiredVars.forEach((varName) => {
    if (!process.env[varName] || process.env[varName] === `your-${varName.toLowerCase()}-from-vercel`) {
      errors.push(`Missing or invalid ${varName} environment variable`);
    }
  });
  if (errors.length > 0) {
    console.warn("\u26A0\uFE0F  Environment Variable Warnings:");
    errors.forEach((err) => console.warn(`   - ${err}`));
    if (process.env.NODE_ENV === "production") {
      console.error("\u274C CRITICAL: Missing required production environment variables");
      console.error("   Set these in your Vercel dashboard: Settings \u2192 Environment Variables");
      console.error("   Required variables: MONGODB_URI, JWT_SECRET, GEMINI_API_KEY");
    }
  } else {
    console.log("\u2705 All required environment variables are configured");
  }
}
validateEnvironment();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use((req, res, next) => {
  if (!req.url.startsWith("/api") && !req.url.includes(".")) {
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});
async function connectMongoDB() {
  try {
    const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/krishi-bondhu";
    await import_mongoose2.default.connect(mongoUrl);
    console.log("\u2705 MongoDB connected successfully");
  } catch (error) {
    console.error("\u274C MongoDB connection failed:", error);
    console.log("\u26A0\uFE0F  Make sure MongoDB is running on port 27017");
  }
}
connectMongoDB();
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
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const existingUser = await User_default.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const user = new User_default({
      email,
      password,
      firstName: firstName || "",
      lastName: lastName || "",
      role: "user"
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
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User_default.findOne({ email }).select("+password");
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
app.post("/api/auth/verify", authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User_default.findById(userId);
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
app.post("/api/admin/create-admin", adminMiddleware, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const existingUser = await User_default.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const user = new User_default({
      email,
      password,
      firstName: firstName || "",
      lastName: lastName || "",
      role: "admin"
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
app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User_default.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
app.patch("/api/admin/users/:id/role", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin", "agent"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const user = await User_default.findByIdAndUpdate(
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
app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User_default.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});
app.get("/api/health", (req, res) => {
  const health = {
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    mode: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: import_mongoose2.default.connection.readyState === 1 ? "connected" : "disconnected",
    environment: {
      hasMongodbUri: !!process.env.MONGODB_URI && process.env.MONGODB_URI !== "your_mongodb_uri",
      hasJwtSecret: !!process.env.JWT_SECRET && process.env.JWT_SECRET !== "your_jwt_secret",
      hasGeminiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key"
    }
  };
  res.json(health);
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
    app.use(import_express.default.static(distPath, {
      maxAge: "1d",
      etag: false
    }));
    app.get("*", (req, res, next) => {
      if (req.url.startsWith("/api")) return next();
      if (import_path.default.extname(req.url) && req.url !== "/") {
        return next();
      }
      console.log(`[SERVER] Handling production SPA request: ${req.url}`);
      res.sendFile(import_path.default.join(distPath, "index.html"), (err) => {
        if (err) {
          console.error("[SERVER] Failed to send index.html:", err);
          res.status(500).end("Server error");
        }
      });
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
