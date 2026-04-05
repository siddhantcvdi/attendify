import React, { createContext, useContext, useState, useEffect } from "react";
import { Subject } from "../data/types";
import { Storage } from "../storage";

interface SubjectsContextValue {
  subjects: Subject[];
  addSubject: (subject: Subject) => void;
  importSubjects: (incoming: Subject[]) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  clearSubjects: () => void;
}

const SubjectsContext = createContext<SubjectsContextValue>({
  subjects: [],
  addSubject: () => {},
  importSubjects: () => {},
  updateSubject: () => {},
  deleteSubject: () => {},
  clearSubjects: () => {},
});

export function SubjectsProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Storage.get<Subject[]>(Storage.KEYS.SUBJECTS).then((saved) => {
      if (saved) setSubjects(saved);
      setLoaded(true);
    });
  }, []);

  function persist(next: Subject[]) {
    setSubjects(next);
    Storage.set(Storage.KEYS.SUBJECTS, next);
  }

  function addSubject(subject: Subject) {
    persist([...subjects, subject]);
  }

  function importSubjects(incoming: Subject[]) {
    const existingIds = new Set(subjects.map((s) => s.id));
    const merged = [...subjects, ...incoming.filter((s) => !existingIds.has(s.id))];
    persist(merged);
  }

  function updateSubject(updated: Subject) {
    persist(subjects.map((s) => (s.id === updated.id ? updated : s)));
  }

  function deleteSubject(id: string) {
    persist(subjects.filter((s) => s.id !== id));
  }

  function clearSubjects() {
    persist([]);
  }

  if (!loaded) return null;

  return (
    <SubjectsContext.Provider value={{ subjects, addSubject, importSubjects, updateSubject, deleteSubject, clearSubjects }}>
      {children}
    </SubjectsContext.Provider>
  );
}

export function useSubjects() {
  return useContext(SubjectsContext);
}
