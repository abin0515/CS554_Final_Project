import admin from "firebase-admin";
import path from "path";
import fs from "fs";

var firebase_admin = null;
// Initialize Firebase Admin once
if (!admin.apps.length && firebase_admin === null) {
    let serviceAccountPath = process.env.FIREBASE_ADMIN_CERT_JSON_PATH;

    var serviceAccount = null;

    // If no cert path is provided in ENV, load test certificate from server/test (base64 priv key cert)
    if (!serviceAccountPath) {
        console.info("Env var FIREBASE_ADMIN_CERT_JSON_PATH is not set.")
        console.info(" - Loading test certificate from server/test/firebase-admin-cert.json")
        console.info(" - If you want to use your own Firebase project, please set this env var and update frontend config.");
        serviceAccountPath = path.join("test", "firebase-admin-cert.b64");
        const serviceAccountAbsolutePath = path.join(process.cwd(), serviceAccountPath);
        const encodedServiceAccount = fs.readFileSync(serviceAccountAbsolutePath, "utf8");
        const decodedServiceAccount = Buffer.from(encodedServiceAccount, "base64").toString("utf8");
        serviceAccount = JSON.parse(decodedServiceAccount);
    } else {
        const serviceAccountAbsolutePath = path.isAbsolute(serviceAccountPath)
            ? serviceAccountPath
            : path.join(process.cwd(), serviceAccountPath);

        // Read and parse the service account JSON file
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountAbsolutePath, "utf8"));
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    firebase_admin = admin.auth();
}

export function getUserDisplayName(uid) {
    return firebase_admin.getUser(uid)
        .then((userRecord) => {
            const username = userRecord.displayName || userRecord.email || "Anonymous User";
            return username;
        })
        .catch((error) => {
            console.error("Error fetching user data:", error);
            throw error;
        });

}


export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
        const decodedToken = await firebase_admin.verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

export {firebase_admin, serviceAccount };
