import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Prestador {
  id?: string;
  nome: string;
  cpf: string;
  telefone: string;
  funcao: string;
}

export const FUNCOES = [
  "Limpeza",
  "Copeiro(a)",
  "Garçom/Garçonete",
  "Cozinheiro(a)",
  "Churrasqueiro(a)",
  "Líder Copa/Cozinha/Limpeza",
  "Outros",
];

export function usePrestadores() {
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "prestadores"), orderBy("nome"));
    return onSnapshot(q, (snap) => {
      setPrestadores(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prestador)));
      setLoading(false);
    });
  }, []);

  return {
    prestadores,
    loading,
    add: (p: Omit<Prestador, "id">) => addDoc(collection(db, "prestadores"), p),
    update: (id: string, p: Partial<Prestador>) => updateDoc(doc(db, "prestadores", id), p),
    remove: (id: string) => deleteDoc(doc(db, "prestadores", id)),
  };
}
