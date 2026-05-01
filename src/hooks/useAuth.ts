import { useState, useEffect } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { isEmailAllowed } from "@/lib/constants";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check domain
        if (isEmailAllowed(user.email)) {
            setUser(user);
        } else {
            toast.error("Acesso restrito aos domínios autorizados");
            signOut(auth);
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (!isEmailAllowed(result.user.email)) {
          toast.error("Acesso restrito aos domínios autorizados");
          await signOut(auth);
          return null;
      }
      return result.user;
    } catch (error: any) {
      console.error("Auth error details:", error);
      const errorCode = error.code ? `(${error.code})` : "";
      toast.error(`Erro ao autenticar com Google ${errorCode}.`);
      return null;
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, loginWithGoogle, logout };
};
