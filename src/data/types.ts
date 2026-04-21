export type AttendanceStatus = "present" | "absent" | "cancelled" | null;

export interface ClassLocation {
  latitude: number;
  longitude: number;
  radius: number; // metres
}

export interface NamedLocation extends ClassLocation {
  id: string;
  name: string;
}

export interface UserProfile {
  name: string;
  minAttendance: number; // percent, e.g. 75
  locations: NamedLocation[]; // first entry is the default location
  autoAttendance: boolean; // whether background auto-attendance is enabled
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  totalClasses: number;
  attendedClasses: number;
  room?: string;
  professor?: string;
  locationId?: string; // if unset, uses the default (first) location
}

export interface Lecture {
  id: string;
  subjectId: string;
  subjectName: string;
  startTime: string; // HH:mm format
  endTime: string;
  room: string;
  professor: string;
  topic: string;
  status: AttendanceStatus;
}
