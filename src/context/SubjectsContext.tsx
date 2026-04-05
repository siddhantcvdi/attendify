import React, { createContext, useContext, useState, useEffect } from "react";
import { Subject } from "../data/types";
import { subjects as SEED_SUBJECTS } from "../data/mockData";
import { Storage } from "../storage";

interface SubjectsContextValue {
  subjects: Subject[];
  addSubject: (subject: Subject) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
}

const SubjectsContext = createContext<SubjectsContextValue>({
  subjects: [],
  addSubject: () => {},
  updateSubject: () => {},
  deleteSubject: () => {},
});

export function SubjectsProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>(SEED_SUBJECTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Storage.get<Subject[]>(Storage.KEYS.SUBJECTS).then((saved) => {
      if (saved && saved.length > 0) setSubjects(saved);
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

  function updateSubject(updated: Subject) {
    persist(subjects.map((s) => (s.id === updated.id ? updated : s)));
  }

  function deleteSubject(id: string) {
    persist(subjects.filter((s) => s.id !== id));
  }

  if (!loaded) return null;

  return (
    <SubjectsContext.Provider value={{ subjects, addSubject, updateSubject, deleteSubject }}>
      {children}
    </SubjectsContext.Provider>
  );
}

export function useSubjects() {
  return useContext(SubjectsContext);
}
