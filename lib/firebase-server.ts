import { getBlob, getBytes, getDownloadURL, getStorage, ref } from "firebase/storage";
import { getFirebaseConfig } from "./firebase-storage";
import fs from 'fs'


export async function downloadFromFirebase(fileKey: string) {
    try {
        const file_name = `tmp/pdf-${Date.now()}.pdf`;

        const app = getFirebaseConfig();
        const storage = getStorage(app);
        const fileRef = ref(storage, fileKey);
        const downloadUrl = await getDownloadURL(fileRef);
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        fs.writeFileSync(file_name, buffer);
        return file_name;
    } catch (error) {
        console.log(error);
    }
}