import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AttendanceStatus, Lecture } from "../data/types";
import { Storage } from "../storage";

type StatusOverrides = Record<string, AttendanceStatus>; // "YYYY-M-D:lectureId" -> status
type ExtraClasses = Record<string, Lecture[]>;           // "YYYY-M-D" -> lectures

interface AttendanceContextValue {
  statusOverrides: StatusOverrides;
  extraClasses: ExtraClasses;
  setStatus: (dateKey: string, lectureId: string, status: AttendanceStatus) => void;
  addExtraClass: (dateKey: string, lecture: Lecture) => void;
}

const AttendanceContext = createContext<AttendanceContextValue>({
  statusOverrides: {},
  extraClasses: {},
  setStatus: () => {},
  addExtraClass: () => {},
});

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [statusOverrides, setStatusOverrides] = useState<StatusOverrides>({});
  const [extraClasses, setExtraClasses] = useState<ExtraClasses>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      Storage.get<StatusOverrides>(Storage.KEYS.ATTENDANCE),
      Storage.get<ExtraClasses>(Storage.KEYS.EXTRA_CLASSES),
    ]).then(([savedStatus, savedExtra]) => {
      if (savedStatus) setStatusOverrides(savedStatus);
      if (savedExtra) setExtraClasses(savedExtra);
      setLoaded(true);
    });
  }, []);

  const setStatus = useCallback((dateKey: string, lectureId: string, status: AttendanceStatus) => {
    setStatusOverrides((prev) => {
      const next = { ...prev, [`${dateKey}:${lectureId}`]: status };
      Storage.set(Storage.KEYS.ATTENDANCE, next);
      return next;
    });
  }, []);

  const addExtraClass = useCallback((dateKey: string, lecture: Lecture) => {
    setExtraClasses((prev) => {
      const next = { ...prev, [dateKey]: [...(prev[dateKey] ?? []), lecture] };
      Storage.set(Storage.KEYS.EXTRA_CLASSES, next);
      return next;
    });
  }, []);

  if (!loaded) return null;

  return (
    <AttendanceContext.Provider value={{ statusOverrides, extraClasses, setStatus, addExtraClass }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  return useContext(AttendanceContext);
}
