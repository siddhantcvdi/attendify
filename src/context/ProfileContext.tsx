import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../data/types";
import { Storage } from "../storage";

const DEFAULT_PROFILE: UserProfile = {
  name: "Siddhant",
  minAttendance: 75,
  classLocation: null,
};

interface ProfileContextValue {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  resetProfile: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    Storage.get<UserProfile>(Storage.KEYS.PROFILE).then((saved) => {
      if (saved) setProfile(saved);
    });
  }, []);

  function updateProfile(patch: Partial<UserProfile>) {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      Storage.set(Storage.KEYS.PROFILE, next);
      return next;
    });
  }

  function resetProfile() {
    setProfile(DEFAULT_PROFILE);
    Storage.set(Storage.KEYS.PROFILE, DEFAULT_PROFILE);
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, resetProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
