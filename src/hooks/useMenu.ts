import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { format } from "date-fns";

export interface MenuItem {
  category: string;
  items: string[];
}

interface MenuData {
  date: Timestamp;
  menu: MenuItem[];
}

export const useMenu = (date: Date = new Date()) => {
  const [menu, setMenu] = useState<MenuItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const dateId = format(date, "yyyy-MM-dd");
        console.log(`[useMenu] Fetching menu for: ${dateId}`);
        const menuRef = doc(db, "menu", dateId);
        const menuSnap = await getDoc(menuRef);

        if (menuSnap.exists()) {
          const data = menuSnap.data() as MenuData;
          setMenu(data.menu);
        } else {
          setMenu(null);
        }
      } catch (err: any) {
        console.error("Fetch menu error:", err);
        setError("Erro ao carregar o cardápio.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [date.toDateString()]);

  return { menu, loading, error };
};
