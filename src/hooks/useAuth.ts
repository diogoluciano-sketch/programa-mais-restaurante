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

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check domain
        if (user.email?.endsWith("@programaleiloes.com")) {
            setUser(user);
        } else {
            toast.error("Acesso restrito ao domínio @programaleiloes.com");
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
      if (!result.user.email?.endsWith("@programaleiloes.com")) {
          toast.error("Acesso restrito ao domínio @programaleiloes.com");
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
