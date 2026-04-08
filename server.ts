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
        console.log("--- STARTING AGGRESSIVE BOOTSTRAP ---");
        const adminEmails = ["admin@admin.com", "alvarowowplayer@gmail.com"];
        const adminPassword = "admin123";
        
        // Use the specific database ID from config
        const db = admin.firestore(config.firestoreDatabaseId);
        console.log(`Using Firestore Database ID: ${config.firestoreDatabaseId}`);
        
        for (const adminEmail of adminEmails) {
          try {
            let uid: string;
            try {
              const user = await admin.auth().getUserByEmail(adminEmail);
              uid = user.uid;
              // Force password reset and ensure user is enabled
              await admin.auth().updateUser(uid, {
                password: adminPassword,
                disabled: false,
                displayName: adminEmail === "admin@admin.com" ? "Administrador" : "Álvaro Ruíz",
              });
              console.log(`[BOOTSTRAP] Admin user ${adminEmail} verified/updated in Auth. UID: ${uid}`);
            } catch (e: any) {
              if (e.code === 'auth/user-not-found') {
                const userRecord = await admin.auth().createUser({
                  email: adminEmail,
                  password: adminPassword,
                  disabled: false,
                  displayName: adminEmail === "admin@admin.com" ? "Administrador" : "Álvaro Ruíz",
                });
                uid = userRecord.uid;
                console.log(`[BOOTSTRAP] Created bootstrap admin user ${adminEmail} in Auth. UID: ${uid}`);
              } else {
                console.error(`[BOOTSTRAP] Error checking Auth for ${adminEmail}:`, e);
                throw e;
              }
            }

            // 1. Ensure User record
            await db.collection('users').doc(uid).set({
              email: adminEmail,
              name: adminEmail === "admin@admin.com" ? "Administrador" : "Álvaro Ruíz",
              role: "admin",
              active: true,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // 2. Ensure Coach record
            await db.collection('coaches').doc(uid).set({
              id: uid,
              name: adminEmail === "admin@admin.com" ? "Administrador" : "Álvaro Ruíz",
              role: 'admin',
              img: `https://picsum.photos/seed/${uid}/100/100`,
              phone: '+34 600 000 000',
              email: adminEmail
            }, { merge: true });

            // 3. Ensure Self-Client record
            const selfClientId = `self_${uid}`;
            await db.collection('clients').doc(selfClientId).set({
              id: selfClientId,
              name: adminEmail === "admin@admin.com" ? "Administrador (Yo)" : "Álvaro Ruíz (Yo)",
              program: 'Mi Propio Plan',
              status: 'Hoy',
              active: true,
              img: `https://picsum.photos/seed/${uid}/100/100`,
              enabledSections: ['workout', 'diet', 'progress', 'habits', 'chat'],
              assignedCoachId: uid
            }, { merge: true });

            console.log(`Aggressive bootstrap completed for ${adminEmail} in Firestore.`);
          } catch (error) {
            console.error(`Error bootstrapping admin user ${adminEmail}:`, error);
          }
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

  app.post("/api/admin/repair", async (req, res) => {
    console.log("--- REPAIR ENDPOINT CALLED ---");
    const adminEmails = ["admin@admin.com", "alvarowowplayer@gmail.com"];
    const adminPassword = "admin123";
    const results = [];

    for (const adminEmail of adminEmails) {
      try {
        let uid: string;
        try {
          const user = await admin.auth().getUserByEmail(adminEmail);
          uid = user.uid;
          // Force password reset and ensure enabled
          await admin.auth().updateUser(uid, {
            password: adminPassword,
            disabled: false
          });
          console.log(`[REPAIR] Updated Auth for ${adminEmail}`);
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            const userRecord = await admin.auth().createUser({
              email: adminEmail,
              password: adminPassword,
              disabled: false,
              displayName: adminEmail === "admin@admin.com" ? "Administrador" : "Álvaro Ruíz",
            });
            uid = userRecord.uid;
            console.log(`[REPAIR] Created Auth for ${adminEmail}`);
          } else {
            throw e;
          }
        }

        const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
        const db = admin.firestore(config.firestoreDatabaseId);
        console.log(`[REPAIR] Using DB: ${config.firestoreDatabaseId}`);
        
        await db.collection('users').doc(uid).set({
          email: adminEmail,
          name: adminEmail === "admin@admin.com" ? "Administrador" : "Álvaro Ruíz",
          role: "admin",
          active: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Ensure coach profile
        await db.collection('coaches').doc(uid).set({
          id: uid,
          name: adminEmail === "admin@admin.com" ? "Administrador" : "Álvaro Ruíz",
          role: 'admin',
          img: `https://picsum.photos/seed/${uid}/100/100`,
          phone: '+34 600 000 000',
          email: adminEmail
        }, { merge: true });

        // Ensure self-client
        const selfClientId = `self_${uid}`;
        await db.collection('clients').doc(selfClientId).set({
          id: selfClientId,
          name: adminEmail === "admin@admin.com" ? "Administrador (Yo)" : "Álvaro Ruíz (Yo)",
          program: 'Mi Propio Plan',
          status: 'Hoy',
          active: true,
          img: `https://picsum.photos/seed/${uid}/100/100`,
          enabledSections: ['workout', 'diet', 'progress', 'habits', 'chat'],
          assignedCoachId: uid
        }, { merge: true });

        results.push({ email: adminEmail, status: 'repaired', uid });
      } catch (error: any) {
        results.push({ email: adminEmail, status: 'error', error: error.message });
      }
    }
    res.json({ success: true, results });
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
