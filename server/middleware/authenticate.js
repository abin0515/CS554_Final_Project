import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Initialize Firebase Admin once
if (!admin.apps.length) {
    let serviceAccountPath = process.env.FIREBASE_ADMIN_CERT_JSON_PATH;

    // If no cert path is provided in ENV, load test certificate
    if (!serviceAccountPath) {
        console.warn("Warning: env var FIREBASE_ADMIN_CERT_JSON_PATH is not set.")
        console.warn(" - Loading test certificate from server/test/firebase-admin-cert.json")
        console.warn(" - This Firebase admin certificate should only be used for testing and not in production.");
        serviceAccountPath = path.join("test", "firebase-admin-cert.json");
    }

    const serviceAccountAbsolutePath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(process.cwd(), serviceAccountPath);

    // Read and parse the service account JSON file
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
