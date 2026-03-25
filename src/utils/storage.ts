import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const uploadFileToFirebase = async (file: File, path: string): Promise<string> => {
  console.log('Starting upload to:', path);
  try {
    const storageRef = ref(storage, path);
    console.log('Storage ref created');
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Upload bytes complete');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Firebase storage upload error:', error);
    throw error;
  }
};
