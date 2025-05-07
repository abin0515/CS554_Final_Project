import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Initialize Firebase Admin once
if (!admin.apps.length) {
    // Get service account file path from env var
    // const serviceAccountPath = process.env.FIREBASE_ADMIN_CERT_JSON_PATH;
    // if (!serviceAccountPath) {
    //     throw new Error("FIREBASE_ADMIN_CERT_JSON_PATH environment variable is not set. Admin cert JSON blob can be acquired from Firebase console.");
    // }

    // Read and parse the service account JSON file
    // const serviceAccountAbsolutePath = path.isAbsolute(serviceAccountPath)
    //     ? serviceAccountPath
    //     : path.join(process.cwd(), serviceAccountPath);
    // const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountAbsolutePath, "utf8"));

    // Directly use the pasted JSON object
    const serviceAccount = {
        "type": "service_account",
        "project_id": "sample-firebase-ai-app-63823",
        "private_key_id": "b4b8a42c9be6aa7727d66b5f1398a70105380c1d",
        "private_key": `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDDPSr5vY3f9WLL
6HoF+Zq8z7p8FpgzC9ywNAteWdwKjHOkH/6FPJYx0tkGIlWJLAEThkYoLwltRk6M
ObUBcNgTEaQQE8GAoeF9VYIRYoTom8jpRd77UXLub2baJPWuhmKigPj7pVdkk1QJ
GZk5rZDHIvplOzNeEDnRyqR8bkr9LxOas8j1R3nZw2IhHvsvGAesRnml1IC8EKEP
2DC12RryRl5Zd5f1KOF1RGjPVrbbN5FnG+5Mhyea0tJRYWeuFZaoIrupyWta8Wng
u8sy+UOUPa6FL2aZ52GDS1ek7y0zorguPPdwP5OZpBkb//kouJktIMhQarYI6lqp
zGq3wf3dAgMBAAECggEAFX4R0Y1G5X0fY6ATcr3wBVH+zvMzzQbExBbum3Pb78NX
ZZ1qCOPLCvARmQXFkcSo16vj5D+NU5y2P+SIYwC3oJ3ECEsMdascZg44M867H9oq
a1eYPOVR+CKGWYRREWXUzNvSzOz+KmG3kgrh3cIYGnvkwakbNgMmQkyC//mqQqWv
A1dlh63mACTIrwO6lVY/bNLXFUBJbZnWDEVAH9giac/vFUhA4aLBCB3wKLeZewmS
Gg5FaPpTjhWTklK2PN28p18oUnmWuYArWUI3+lLyT5P/A7IA6CKUW0qV2zIPhifi
4TmmqoNoQBKChJbab+pzrDScHtV/FQdGGC54j2GgZwKBgQD6PJcUxK8u4b+vGfdz
1sYgW8n9vyxvaiLegbzs6vd6SOPwZTT9fHoB1KcUW1jjt4r6kIYCKzQIjSo03y7X
usT42qSBuG0OTaCISbaR9+pVIzP9Wp+3VL+vcrylyOsJbMagbF+lpD5rjYd8i9cc
6SXJ/2VXxUXMNUE1VF+oZ0CRHwKBgQDHvE7P3V6W3id5Mi6WKENB0GWisxpNZgny
YkXnFkIU+vxPW/NTfUqN11UFcTbt7MvT+QuSNGOVspWE4H1g3DvARYremiBVxkxc
wf0/vZJOdex8QK9Zv6D/jHzXTYzsU0F4N4LNrwwBVbtmUnmfB1pVTY0oI+YpqWwJ
sXNVMDnlgwKBgCdtYIifLNMAMsmOF9Uio/j5PWxDsOalHHVej7vska2sym1YJO9D
q52aOfEVK35Frxonp1W0JPCr/VhzSdgnz10+Zekie9xjEsYmhyOcoklj0I88timW
qtUkCOE+NPo5L1qbeL6KkGM124EeL3iYq6GWIgugQ40XXvzeHGxWSHAVAoGAVYrM
pjHE5RBYD4vyb9TmmTVLkhbq2OMut2RnU8UwoBOuI77Zw5QRbhYfD6mhQNz9ntc2
oXNWgzJs3u/WQrmPzZT7GMMhvhqjccaTU8047+mJUt3RO7ralRfyD7Pi+wPdMkNz
/etOVPQGwpfoBrf7dDU2k05ssMMixjP9lSqGYUkCgYAaokD01VDPv/wPqU/k5VHt
aX93mfD3ur8ZoLVlL2YdJm2EkXMuuo6KIVkHVAYsWFEkMay/f+mncq3qUwOfbTHv
1QfOc2R//ElG1oGUe85dYo/QlsnLCjF/ggd1lCRtxMsxbexsfbrnZSMfQusKn887
jMSvNGUlvqWiTMjRV1sKSw==
-----END PRIVATE KEY-----`,
        "client_email": "firebase-adminsdk-fbsvc@sample-firebase-ai-app-63823.iam.gserviceaccount.com",
        "client_id": "114368260403361008126",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40sample-firebase-ai-app-63823.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    };

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
