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
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
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

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
