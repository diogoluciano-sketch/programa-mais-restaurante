import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { format, addDays } from "date-fns";
import { MenuItem } from "./useMenu";

export interface DayMenu {
  date: Date;
  dateId: string;
  menu: MenuItem[] | null;
}

export const useWeekMenu = () => {
  const [weekMenus, setWeekMenus] = useState<DayMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeekMenus = async () => {
      setLoading(true);
      const today = new Date();
      const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

      const results = await Promise.all(
        days.map(async (date) => {
          const dateId = format(date, "yyyy-MM-dd");
          try {
            const menuSnap = await getDoc(doc(db, "menu", dateId));
            return {
              date,
              dateId,
              menu: menuSnap.exists() ? (menuSnap.data().menu as MenuItem[]) : null,
            };
          } catch {
            return { date, dateId, menu: null };
          }
        })
      );

      setWeekMenus(results);
      setLoading(false);
    };

    fetchWeekMenus();
  }, []);

  return { weekMenus, loading };
};
