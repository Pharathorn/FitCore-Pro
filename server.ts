import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    try {
      admin.initializeApp({
        projectId: config.projectId,
      });
      console.log("Firebase Admin initialized for project:", config.projectId);

      // Bootstrap Admin User
      const bootstrapAdmin = async () => {
        const adminEmail = "admin@admin.com";
        const adminPassword = "admin123";
        try {
          try {
            const user = await admin.auth().getUserByEmail(adminEmail);
            console.log("Admin user already exists in Auth:", user.uid);
          } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
              const userRecord = await admin.auth().createUser({
                email: adminEmail,
                password: adminPassword,
                displayName: "Administrador",
              });
              console.log("Created bootstrap admin user in Auth:", userRecord.uid);
              
              // Also ensure Firestore record exists
              const db = admin.firestore();
              await db.collection('users').doc(userRecord.uid).set({
                email: adminEmail,
                name: "Administrador",
                role: "admin",
                active: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });
              console.log("Created bootstrap admin record in Firestore.");
            } else {
              throw e;
            }
          }
        } catch (error) {
          console.error("Error bootstrapping admin user:", error);
        }
      };
      await bootstrapAdmin();
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
    }
  }

  app.use(express.json());

  // API Routes
  app.post("/api/users/block", async (req, res) => {
    const { uid, disabled } = req.body;
    try {
      await admin.auth().updateUser(uid, { disabled });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/users/:uid", async (req, res) => {
    const { uid } = req.params;
    try {
      await admin.auth().deleteUser(uid);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
