import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Initialize Firebase Admin once
if (!admin.apps.length) {
    // Get service account file path from env var
    const serviceAccountPath = process.env.FIREBASE_ADMIN_CERT_JSON_PATH;
    if (!serviceAccountPath) {
        throw new Error("FIREBASE_ADMIN_CERT_JSON_PATH environment variable is not set. Admin cert JSON blob can be acquired from Firebase console.");
    }

    // Read and parse the service account JSON file
    const serviceAccountAbsolutePath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(process.cwd(), serviceAccountPath);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountAbsolutePath, "utf8"));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}


export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
