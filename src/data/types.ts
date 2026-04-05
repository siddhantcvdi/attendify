export type AttendanceStatus = "present" | "absent" | "cancelled" | null;

export interface ClassLocation {
  latitude: number;
  longitude: number;
  radius: number; // metres
}

export interface UserProfile {
  name: string;
  minAttendance: number; // percent, e.g. 75
  classLocation: ClassLocation | null;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  totalClasses: number;
  attendedClasses: number;
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
