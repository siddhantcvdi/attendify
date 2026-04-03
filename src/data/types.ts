export type AttendanceStatus = "present" | "absent" | "cancelled" | null;

export interface Subject {
  id: string;
  name: string;
  code: string;
  totalClasses: number;
  attendedClasses: number;
  color: string;
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
