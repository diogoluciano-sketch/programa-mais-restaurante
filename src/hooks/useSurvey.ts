import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function useSurvey() {
  const submitSurvey = async (rating: number, comment: string) => {
    const docRef = await addDoc(collection(db, 'satisfaction'), {
      rating,
      comment,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  };

  return { submitSurvey };
}
