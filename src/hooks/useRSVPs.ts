import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, setDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { format } from 'date-fns';
import { isRSVPOpen } from '@/lib/constants';

export function useRSVPs() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [isAlreadyConfirmed, setIsAlreadyConfirmed] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');
  const [isLocked, setIsLocked] = useState(!isRSVPOpen());

  useEffect(() => {
    // Check lock status periodically or on mount
    const checkStatus = () => setIsLocked(!isRSVPOpen());
    checkStatus();
    
    const interval = setInterval(checkStatus, 60000); // Check every minute
    
    const rsvpsRef = collection(db, 'rsvps');
    const q = query(rsvpsRef, where('date', '==', today));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
      
      if (user) {
        const userConfirmation = snapshot.docs.find(doc => doc.id === user.uid || doc.data().userId === user.uid);
        setIsAlreadyConfirmed(!!userConfirmation);
      }
    });
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user, today]);

  const addConfirmation = async (name: string) => {
    if (!user) throw new Error("Usuário não autenticado");
    
    if (!isRSVPOpen()) {
      throw new Error("O período de confirmação de almoço é das 07:00 às 10:00.");
    }

    // Use setDoc with userId as document ID to ensure 1 RSVP per user per day.
    const docId = `${today}_${user.uid}`;
    const docRef = doc(db, 'rsvps', docId);
    
    await setDoc(docRef, {
      userId: user.uid,
      userName: name,
      userEmail: user.email,
      date: today,
      createdAt: serverTimestamp()
    });
    
    return docId;
  };

  const removeConfirmation = async () => {
    if (!user) return;
    const docId = `${today}_${user.uid}`;
    await deleteDoc(doc(db, 'rsvps', docId));
  };

  return { count, isAlreadyConfirmed, isLocked, addConfirmation, removeConfirmation };
}
