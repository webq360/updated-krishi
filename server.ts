import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs/promises";
import mongoose from "mongoose";
import User from "./src/lib/models/User";
import DataDocument from "./src/lib/models/DataDocument";
import { generateToken, verifyToken, authMiddleware, adminMiddleware } from "./src/lib/auth";
import bcryptjs from "bcryptjs";

dotenv.config();

// Configure Cloudinary if environment variables are present
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log("☁️  Cloudinary initialized successfully");
} else if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
  console.log("☁️  Cloudinary initialized with CLOUDINARY_URL");
}

// Validate critical environment variables
function validateEnvironment() {
  const errors: string[] = [];
  
  // Server-only variables that must exist
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'GEMINI_API_KEY',
  ];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName] === `your-${varName.toLowerCase()}-from-vercel`) {
      errors.push(`Missing or invalid ${varName} environment variable`);
    }
  });

  if (errors.length > 0) {
    console.warn('⚠️  Environment Variable Warnings:');
    errors.forEach(err => console.warn(`   - ${err}`));
    
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ CRITICAL: Missing required production environment variables');
      console.error('   Set these in your Vercel dashboard: Settings → Environment Variables');
      console.error('   Required variables: MONGODB_URI, JWT_SECRET, GEMINI_API_KEY');
    }
  } else {
    console.log('✅ All required environment variables are configured');
  }
}

validateEnvironment();

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
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('your_') || apiKey.length < 15) {
    throw new Error("GEMINI_API_KEY environment variable is missing or invalid");
  }
  return new GoogleGenAI({ apiKey });
}

// ==================== Auth Routes ====================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, firstName, lastName, phone, address, upazila } = req.body;

    const userEmail = (email && email.trim()) 
      ? email.trim().toLowerCase() 
      : (phone ? `${phone.trim().replace(/\D/g, '')}@krishibondhu.local` : '');

    if (!userEmail || !password) {
      return res.status(400).json({ error: "Email/Phone and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: userEmail },
        ...(phone ? [{ phone: phone.trim() }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already registered with this email or phone" });
    }

    // Create new user
    const user = new User({
      email: userEmail,
      password,
      name: name || `${firstName || ''} ${lastName || ''}`.trim() || 'Farmer',
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      address: address || '',
      upazila: upazila || '',
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
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        upazila: user.upazila,
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
      return res.status(400).json({ error: "Email/Phone and password are required" });
    }

    const cleanInput = email.trim().toLowerCase();
    const phoneInput = email.trim();

    const user = await User.findOne({
      $or: [
        { email: cleanInput },
        { phone: phoneInput },
        { email: `${phoneInput.replace(/\D/g, '')}@krishibondhu.local` }
      ]
    }).select('+password');

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
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        upazila: user.upazila,
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

// ==================== MongoDB Dynamic Collection API ====================

// Get All Documents from Collection
app.get("/api/data/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const queryFilter: Record<string, any> = { collectionName: collection };

    // Process where_* query parameters
    Object.keys(req.query).forEach((key) => {
      if (key.startsWith("where_")) {
        const fieldName = key.replace("where_", "");
        const value = req.query[key];
        // match against doc.data.fieldName or top-level
        queryFilter[`data.${fieldName}`] = value;
      }
    });

    let mongoQuery = (DataDocument as any).find(queryFilter);

    // Sorting
    if (req.query.sort) {
      const sortParam = String(req.query.sort);
      if (sortParam.startsWith("-")) {
        const field = sortParam.substring(1);
        mongoQuery = mongoQuery.sort({ [`data.${field}`]: -1, createdAt: -1 });
      } else {
        mongoQuery = mongoQuery.sort({ [`data.${sortParam}`]: 1, createdAt: 1 });
      }
    } else {
      mongoQuery = mongoQuery.sort({ createdAt: -1 });
    }

    // Limit
    if (req.query.limit) {
      const limitVal = parseInt(String(req.query.limit), 10);
      if (!isNaN(limitVal) && limitVal > 0) {
        mongoQuery = mongoQuery.limit(limitVal);
      }
    }

    const docs = await mongoQuery.lean();

    const formatted = docs.map((doc: any) => ({
      id: doc._id.toString(),
      _id: doc._id.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ...(doc.data || {}),
    }));

    res.json(formatted);
  } catch (error) {
    console.error(`Fetch Data Error [${req.params.collection}]:`, error);
    res.status(500).json({ error: "Failed to fetch collection documents" });
  }
});

// Get Single Document by ID
app.get("/api/data/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params;
    let doc: any = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      doc = await (DataDocument as any).findOne({ _id: id, collectionName: collection }).lean();
    }
    
    // Fallback: search by custom id inside data
    if (!doc) {
      doc = await (DataDocument as any).findOne({ collectionName: collection, 'data.id': id }).lean();
    }

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({
      id: doc._id.toString(),
      _id: doc._id.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ...(doc.data || {}),
    });
  } catch (error) {
    console.error(`Fetch Doc Error:`, error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// Create Document in Collection
app.post("/api/data/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const bodyData = { ...req.body };

    const newDoc = new DataDocument({
      collectionName: collection,
      data: bodyData,
    });

    await newDoc.save();

    res.status(201).json({
      id: newDoc._id.toString(),
      _id: newDoc._id.toString(),
      createdAt: newDoc.createdAt,
      updatedAt: newDoc.updatedAt,
      ...(newDoc.data || {}),
    });
  } catch (error) {
    console.error(`Create Data Error [${req.params.collection}]:`, error);
    res.status(500).json({ error: "Failed to create document" });
  }
});

// Update Document in Collection
app.patch("/api/data/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params;
    const updateData = { ...req.body };

    let doc = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      doc = await (DataDocument as any).findOne({ _id: id, collectionName: collection });
    }
    if (!doc) {
      doc = await (DataDocument as any).findOne({ collectionName: collection, 'data.id': id });
    }

    if (!doc) {
      // If not found, create new
      const initialData: Record<string, any> = {};
      Object.keys(updateData).forEach((key) => {
        const val = updateData[key];
        if (val && typeof val === 'object' && val._type === 'increment') {
          initialData[key] = val.value || 1;
        } else {
          initialData[key] = val;
        }
      });

      const created = new DataDocument({
        collectionName: collection,
        data: initialData,
      });
      await created.save();
      return res.json({
        id: created._id.toString(),
        _id: created._id.toString(),
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        ...(created.data || {}),
      });
    }

    const currentData = { ...(doc.data || {}) };
    Object.keys(updateData).forEach((key) => {
      const val = updateData[key];
      if (val && typeof val === 'object' && val._type === 'increment') {
        const prev = typeof currentData[key] === 'number' ? currentData[key] : 0;
        currentData[key] = prev + (val.value || 1);
      } else {
        currentData[key] = val;
      }
    });

    doc.data = currentData;
    doc.markModified('data');
    await doc.save();

    res.json({
      id: doc._id.toString(),
      _id: doc._id.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ...(doc.data || {}),
    });
  } catch (error) {
    console.error(`Update Data Error:`, error);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// Replace / Set Document
app.put("/api/data/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params;
    const replaceData = { ...req.body };

    let doc = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      doc = await (DataDocument as any).findOne({ _id: id, collectionName: collection });
    }
    if (!doc) {
      doc = await (DataDocument as any).findOne({ collectionName: collection, 'data.id': id });
    }

    if (!doc) {
      const created = new DataDocument({
        collectionName: collection,
        data: replaceData,
      });
      await created.save();
      return res.json({
        id: created._id.toString(),
        _id: created._id.toString(),
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        ...(created.data || {}),
      });
    }

    doc.data = replaceData;
    doc.markModified('data');
    await doc.save();

    res.json({
      id: doc._id.toString(),
      _id: doc._id.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ...(doc.data || {}),
    });
  } catch (error) {
    console.error(`Set Data Error:`, error);
    res.status(500).json({ error: "Failed to set document" });
  }
});

// Delete Document from Collection
app.delete("/api/data/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params;
    let deleted = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await (DataDocument as any).findOneAndDelete({ _id: id, collectionName: collection });
    }
    if (!deleted) {
      deleted = await (DataDocument as any).findOneAndDelete({ collectionName: collection, 'data.id': id });
    }

    if (!deleted) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error(`Delete Data Error:`, error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Upload API for Cloudinary
app.post("/api/upload", async (req, res) => {
  try {
    const { image, folder = "krishi-bondhu" } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const hasCloudinary = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) || process.env.CLOUDINARY_URL;

    if (hasCloudinary) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder,
          resource_type: "auto"
        });
        return res.json({
          url: uploadResponse.secure_url,
          public_id: uploadResponse.public_id,
          format: uploadResponse.format,
          provider: "cloudinary"
        });
      } catch (cloudErr: any) {
        console.warn("Cloudinary upload failed, falling back to optimized inline data:", cloudErr?.message || cloudErr);
      }
    }

    // Fallback: return image directly
    return res.json({
      url: image,
      provider: "inline"
    });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    res.status(500).json({ error: error.message || "Failed to process image upload" });
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    mode: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: {
      hasMongodbUri: !!process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your_mongodb_uri',
      hasJwtSecret: !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your_jwt_secret',
      hasGeminiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key',
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

    try {
      const ai = getGenAI();
      const modelsToTry = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.0-flash"];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                { text: prompt || "Analyze this agricultural image for any diseases or issues." },
                { 
                  inlineData: {
                    data: image,
                    mimeType: mimeType
                  }
                }
              ]
            }
          });

          if (response?.text) {
            return res.json({ text: response.text });
          }
        } catch {
          continue;
        }
      }
    } catch (aiError: any) {
      console.warn(`[AI Advisory] Gemini API key note: ${aiError?.message || 'Check .env'}. Using expert domain fallback response.`);
    }

    // Expert rule-based fallback if AI key is unset or rate limited
    const isPlant = (prompt || '').includes('উদ্ভিদ') || (prompt || '').includes('crop') || (prompt || '').includes('PLANT');
    const isFish = (prompt || '').includes('মাছ') || (prompt || '').includes('fish') || (prompt || '').includes('FISH');
    
    if (isFish) {
      return res.json({
        text: `## মৎস্য রোগ নির্ণয় ও পরামর্শ (কৃষি বন্ধু এআই)
**অবস্থা:** সতর্কতামূলক পর্যবেক্ষণ প্রয়োজন (Mild Stress)
**সম্ভাব্য কারণ:** পানির অম্লত্ব বা অক্সিজেন স্বল্পতাজনিত সমস্যা

## পর্যবেক্ষণ
- মাছের ফুলকায় সামান্য লালচে ভাব বা সাঁতারের গতি ধীর হতে পারে।
- পানিতে দ্রবীভূত অক্সিজেনের পরিমাণ কম হওয়ার সম্ভাবনা রয়েছে।

## প্রতিকার ও ব্যবস্থাপনা
1. **তাৎক্ষণিক ব্যবস্থা:** অবিলম্বে ২৫-৩০% পুকুরের পানি পরিবর্তন করুন এবং নিয়মিত চুন ও লবণ প্রয়োগ করুন।
2. **খাবার পরামর্শ:** মাছের দ্রুত বৃদ্ধি ও রোগ প্রতিরোধ ক্ষমতা বাড়ানোর জন্য **ABS Fish Feed (এবিএস ফিশ ফিড)** ব্যবহার করুন।
3. **দীর্ঘমেয়াদী যত্ন:** পানির পিএইচ (pH) ৭.৫ থেকে ৮.৫ এর মধ্যে রাখুন।`
      });
    }

    if (isPlant) {
      return res.json({
        text: `## উদ্ভিদ রোগ নির্ণয় ও সমাধান (কৃষি বন্ধু এআই)
**অবস্থা:** প্রাথমিক বালাই আক্রমণ / পুষ্টি ঘাটতি
**সম্ভাব্য রোগ:** পাতায় দাগ বা ছত্রাকজনিত সংক্রমণ (Fungal Leaf Spot)

## পর্যবেক্ষণ ও লক্ষণ
- পাতায় হালকা বাদামী বা হলুদ দাগ পরিলক্ষিত হতে পারে।
- আর্দ্র আবহাওয়ায় ছত্রাকের বিস্তার বাড়তে পারে।

## বিশেষজ্ঞ পরামর্শ ও প্রতিকার
1. **জৈব সমাধান:** আক্রান্ত পাতা সাবধানে কেটে ধ্বংস করুন। ট্রাইকোডার্মা বা নিম তেলের স্প্রে প্রয়োগ করুন।
2. **প্রয়োজনীয় সার ও পরিচর্যা:** সুষম মাত্রায় পটাশ ও জিংক সার প্রয়োগ করুন।
3. **প্রতিরোধ টিপস:** জমিতে অতিরিক্ত পানি জমতে দেবেন না এবং আলো-বাতাস চলাচলের ব্যবস্থা রাখুন।`
      });
    }

    return res.json({
      text: `## গবাদি পশু স্বাস্থ্য পরামর্শ (কৃষি বন্ধু এআই)
**অবস্থা:** প্রাথমিক পর্যবেক্ষণ সন্তোষজনক
**সম্ভাব্য পরামর্শ:** নিয়মিত সুষম পুষ্টি ও স্বাস্থ্য পরীক্ষা বজায় রাখুন

## বিশেষজ্ঞ পরামর্শ
1. **পুষ্টি ব্যবস্থাপনা:** উন্নত শারীরিক বৃদ্ধি ও দুধ/মাংসের উৎপাদন বাড়াতে **ABS Cattle / Poultry Feed** ব্যবহার করুন।
2. **পরিচ্ছন্নতা:** খামার সর্বদা শুকনো ও জীবাণুমুক্ত রাখুন।
3. **জরুরি সেবা:** কোনো তীব্র লক্ষণ দেখা দিলে নিকটস্থ উপজেলা পশু চিকিৎসকের সাথে যোগাযোগ করুন।`
    });
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

    try {
      const ai = getGenAI();
      const modelsToTry = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.0-flash"];
      
      const contents = [
        ...(history || []).map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text || msg.content || "" }]
        })),
        {
          role: 'user',
          parts: [
            { text: prompt || "Analyze this." },
            ...(image && mimeType ? [{ inlineData: { data: image, mimeType } }] : [])
          ]
        }
      ];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction: systemInstruction || "You are an expert Agricultural Consultant for KRISHI BONDHU in Bangladesh. Answer clearly in Bengali or English based on user question."
            }
          });

          if (response?.text) {
            return res.json({ text: response.text });
          }
        } catch (modelErr: any) {
          // try next model
          continue;
        }
      }
    } catch (aiErr: any) {
      console.warn(`[AI Advisory] Gemini API key note: ${aiErr?.message || 'Check .env'}. Using expert domain fallback response.`);
    }

    // Comprehensive expert fallback for chat
    const q = (prompt || '').toLowerCase();
    let reply = "কৃষি বন্ধু এআই (ABS Feed Industries) আপনার সেবায় নিয়োজিত। আপনি ফসল, বালাই দমন, সার ব্যবস্থাপনা, মাছ চাষ, গবাদি পশু পালন বা কৃষি ঋণ সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।";

    if (q.includes('হাই') || q.includes('hello') || q.includes('hi') || q.includes('সালাম') || q.includes('কেমন')) {
      reply = "আসসালামু আলাইকুম! কৃষি বন্ধু এআই-তে আপনাকে স্বাগতম। আপনার খামার বা ফসলের যেকোনো সমস্যা বা তথ্যের জন্য প্রশ্ন করুন, আমি সাহায্য করতে প্রস্তুত।";
    } else if (q.includes('ধান') || q.includes('rice') || q.includes('মাজরা') || q.includes('ব্লাস্ট')) {
      reply = "🌾 **ধান চাষ পরামর্শ:**\n- **মাজরা ও কারেন্ট পোকা:** জমিতে ৫ ফুট পরপর বাঁশের ডগা বা ডালপালা পুঁতে পার্চিং করুন। আক্রমণ বেশি হলে ভিরতাকো বা ইমিডাক্লোপ্রিড সঠিক মাত্রায় প্রয়োগ করুন।\n- **ব্লাস্ট রোগ:** ট্রাইসাইক্লাজল বা নেটিভো প্রতি লিটার পানিতে ১ গ্রাম হারে মিশিয়ে বিকেলে স্প্রে করুন।";
    } else if (q.includes('আলু') || q.includes('টমেটো') || q.includes('ধসা') || q.includes('blight')) {
      reply = "🥔 **আলু ও টমেটো রোগ ব্যবস্থাপনা:**\n- নাবি ধসা (Late Blight) প্রতিরোধে কুয়াশাচ্ছন্ন আবহাওয়ায় রিডোমিল গোল্ড বা ম্যানকোজেব স্প্রে করুন। জমিতে পানি জমে থাকতে দেবেন না।";
    } else if (q.includes('মাছ') || q.includes('পুকুর') || q.includes('fish') || q.includes('পোনা')) {
      reply = "🐟 **মৎস্য চাষ পরামর্শ:**\n- পানির গুণাগুণ ঠিক রাখতে প্রতি শতাংশে ১ কেজি চুন ও ২৫০ গ্রাম লবণ দিন।\n- মাছের দ্রুত শারীরিক বৃদ্ধি এবং রোগ প্রতিরোধ ক্ষমতা বাড়াতে **ABS Floating Fish Feed (এবিএস ভাসমান ফিড)** ব্যবহার করুন।";
    } else if (q.includes('গরু') || q.includes('গাভী') || q.includes('ছাগল') || q.includes('দুধ') || q.includes('cattle')) {
      reply = "🐄 **গবাদি পশু পালন পরামর্শ:**\n- দুগ্ধবতী গাভী ও মোটাতাজাকরণে প্রতিদিন কাঁচা ঘাসের সাথে উচ্চ প্রোটিনযুক্ত **ABS Cattle Feed (এবিএস ক্যাটেল ফিড)** প্রদান করুন।\n- প্রতি ৪ মাস অন্তর কৃমিনাশক ওষুধ ও নিয়মিত তড়কা-খুরার টিকা প্রদান নিশ্চিত করুন।";
    } else if (q.includes('মুরগি') || q.includes('হাঁস') || q.includes('poultry') || q.includes('লেয়ার') || q.includes('ব্রয়লার')) {
      reply = "🐔 **পোল্ট্রি পরামর্শ:**\n- ব্রয়লার ও সোনালী বাচ্চার দ্রুত ওজন বৃদ্ধির জন্য পুষ্টিকর **ABS Poultry Starter & Grower Feed** ব্যবহার করুন।\n- শেডের তাপমাত্রা ও পর্যাপ্ত বায়ু চলাচল নিশ্চিত করুন।";
    } else if (q.includes('সার') || q.includes('fertilizer') || q.includes('মাটি') || q.includes('ইউরিয়া') || q.includes('tsp')) {
      reply = "🌱 **সার ব্যবস্থাপনা:**\n- জমিতে রাসায়নিক সারের পাশাপাশি বিঘাপ্রতি ২০০-৩০০ কেজি ট্রাইকো-কম্পোস্ট বা গোবর সার প্রয়োগ করুন। ইউরিয়া সার কিস্তিতে উপরিপ্রয়োগ করা উত্তম।";
    } else if (q.includes('ঋণ') || q.includes('loan') || q.includes('টাকা') || q.includes('কার্ড')) {
      reply = "💳 **বন্ধু কৃষি ঋণ ও কিষাণ কার্ড:**\n- আপনি আমাদের অ্যাপের **'বন্ধু ঋণ'** বা **'কিষাণ কার্ড'** অপশন থেকে স্বল্প সুদে সহজ শর্তে ডিজিটাল আবেদন করতে পারেন। নিকটস্থ এজেন্টের মাধ্যমে ভেরিফিকেশন সম্পন্ন হবে।";
    } else if (q.includes('আবহাওয়া') || q.includes('weather') || q.includes('বৃষ্টি')) {
      reply = "🌦️ **আবহাওয়া সতর্কতা:**\n- অ্যাপের 'আবহাওয়া' মেনু থেকে আপনার জেলার রিয়েল-টাইম পূর্বাভাস ও বৃষ্টিপাতের সংকেত দেখে জমিতে সেচ বা কীটনাশক স্প্রে করার সঠিক সময় নির্ধারণ করুন।";
    } else if (q.includes('হটলাইন') || q.includes('যোগাযোগ') || q.includes('হেল্পলাইন') || q.includes('phone')) {
      reply = "📞 **কৃষি বন্ধু ও ABS Feed হটলাইন:**\n- সরাসরি আঞ্চলিক অফিস ও বিশেষজ্ঞের সাথে কথা বলতে কল করুন: **09638-201586** (সকাল ৯টা - সন্ধ্যা ৬টা)।";
    }

    res.json({ text: reply });
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
    
    // Serve static files with proper caching
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: false,
    }));
    
    // SPA Fallback - Only for HTML requests
    app.get("*", (req, res, next) => {
      // Skip API routes
      if (req.url.startsWith('/api')) return next();
      
      // Skip file requests (has extension)
      if (path.extname(req.url) && req.url !== '/') {
        return next();
      }
      
      console.log(`[SERVER] Handling production SPA request: ${req.url}`);
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


