import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes, uploadBytesResumable } from "firebase/storage";

export function getFirebaseConfig() {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "chatpdf-76534.firebaseapp.com",
    projectId: "chatpdf-76534",
    storageBucket: "chatpdf-76534.appspot.com",
    messagingSenderId: "22532495585",
    appId: "1:22532495585:web:be76940ab4b67eeb583fa0",
    measurementId: "G-517S4Q2ZJC"
  };

  const app = initializeApp(firebaseConfig);
  return app;
}

export async function uploadToFirebase(file: File) {
  try {

    const app = getFirebaseConfig();
    const storage = getStorage(app);

    const file_key = Date.now().toString() + file.name.replace(' ', "-");

    const storageRef = ref(storage, file_key);

    const uploadTask = await uploadBytes(storageRef, file);

    // uploadTask.on('state_changed', (snapshot) => {
    //   const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    //   console.log('Upload is ' + progress + '% done');
    // },
    //   (error) => {
    //     console.log(error)
    //   },
    //   () => {
    //     getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
    //       console.log('File available at', downloadURL);
    //     });
    //   }

    // )

    return Promise.resolve({
      file_key,
      file_name: file.name
    });

  } catch (error) {

  }

}

export function getFirebaseDownloadUrl(file_key: string) {
  const app = getFirebaseConfig();
  const storage = getStorage(app);
  const fileRef = ref(storage, file_key);
  return getDownloadURL(fileRef);
}