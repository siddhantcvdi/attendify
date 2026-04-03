import { Lecture } from "./types";

// Weekday schedules: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
// No lectures on weekends
const weekdaySchedules: Record<number, Omit<Lecture, "id" | "status">[]> = {
  1: [
    // Monday
    {
      subjectId: "sub-1",
      subjectName: "Data Structures",
      startTime: "09:00",
      endTime: "10:00",
      room: "Room 301",
      professor: "Dr. Rahul Mehta",
      topic: "AVL Trees & Rotations",
    },
    {
      subjectId: "sub-2",
      subjectName: "Operating Systems",
      startTime: "10:15",
      endTime: "11:15",
      room: "Room 204",
      professor: "Prof. Anita Sharma",
      topic: "Process Scheduling",
    },
    {
      subjectId: "sub-3",
      subjectName: "Database Management",
      startTime: "11:30",
      endTime: "12:30",
      room: "Lab 102",
      professor: "Dr. Vikram Patel",
      topic: "Normalization & 3NF",
    },
    {
      subjectId: "sub-5",
      subjectName: "Software Engineering",
      startTime: "14:00",
      endTime: "15:00",
      room: "Room 301",
      professor: "Dr. Sanjay Verma",
      topic: "Agile Methodologies",
    },
  ],
  2: [
    // Tuesday
    {
      subjectId: "sub-4",
      subjectName: "Computer Networks",
      startTime: "09:00",
      endTime: "10:00",
      room: "Room 405",
      professor: "Prof. Neha Gupta",
      topic: "TCP/IP Protocol Suite",
    },
    {
      subjectId: "sub-6",
      subjectName: "Mathematics III",
      startTime: "10:15",
      endTime: "11:15",
      room: "Room 108",
      professor: "Dr. Priya Iyer",
      topic: "Laplace Transforms",
    },
    {
      subjectId: "sub-1",
      subjectName: "Data Structures",
      startTime: "11:30",
      endTime: "12:30",
      room: "Lab 201",
      professor: "Dr. Rahul Mehta",
      topic: "Graph Traversals",
    },
    {
      subjectId: "sub-2",
      subjectName: "Operating Systems",
      startTime: "14:00",
      endTime: "15:00",
      room: "Room 204",
      professor: "Prof. Anita Sharma",
      topic: "Memory Management",
    },
  ],
  3: [
    // Wednesday
    {
      subjectId: "sub-3",
      subjectName: "Database Management",
      startTime: "09:00",
      endTime: "10:00",
      room: "Lab 102",
      professor: "Dr. Vikram Patel",
      topic: "SQL Joins & Subqueries",
    },
    {
      subjectId: "sub-5",
      subjectName: "Software Engineering",
      startTime: "10:15",
      endTime: "11:15",
      room: "Room 301",
      professor: "Dr. Sanjay Verma",
      topic: "Design Patterns",
    },
    {
      subjectId: "sub-6",
      subjectName: "Mathematics III",
      startTime: "11:30",
      endTime: "12:30",
      room: "Room 108",
      professor: "Dr. Priya Iyer",
      topic: "Fourier Series",
    },
    {
      subjectId: "sub-4",
      subjectName: "Computer Networks",
      startTime: "14:00",
      endTime: "15:00",
      room: "Room 405",
      professor: "Prof. Neha Gupta",
      topic: "Routing Algorithms",
    },
  ],
  4: [
    // Thursday
    {
      subjectId: "sub-1",
      subjectName: "Data Structures",
      startTime: "09:00",
      endTime: "10:00",
      room: "Room 301",
      professor: "Dr. Rahul Mehta",
      topic: "Dynamic Programming",
    },
    {
      subjectId: "sub-2",
      subjectName: "Operating Systems",
      startTime: "10:15",
      endTime: "11:15",
      room: "Room 204",
      professor: "Prof. Anita Sharma",
      topic: "Deadlock Detection",
    },
    {
      subjectId: "sub-3",
      subjectName: "Database Management",
      startTime: "11:30",
      endTime: "12:30",
      room: "Lab 102",
      professor: "Dr. Vikram Patel",
      topic: "Transaction Management",
    },
    {
      subjectId: "sub-5",
      subjectName: "Software Engineering",
      startTime: "15:15",
      endTime: "16:15",
      room: "Room 301",
      professor: "Dr. Sanjay Verma",
      topic: "Testing Strategies",
    },
  ],
  5: [
    // Friday
    {
      subjectId: "sub-4",
      subjectName: "Computer Networks",
      startTime: "09:00",
      endTime: "10:00",
      room: "Room 405",
      professor: "Prof. Neha Gupta",
      topic: "Network Security",
    },
    {
      subjectId: "sub-6",
      subjectName: "Mathematics III",
      startTime: "10:15",
      endTime: "11:15",
      room: "Room 108",
      professor: "Dr. Priya Iyer",
      topic: "Z-Transforms",
    },
    {
      subjectId: "sub-1",
      subjectName: "Data Structures",
      startTime: "11:30",
      endTime: "12:30",
      room: "Room 301",
      professor: "Dr. Rahul Mehta",
      topic: "Heap & Priority Queue",
    },
  ],
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getLecturesForDate(date: Date): Lecture[] {
  const dayOfWeek = date.getDay();
  const templates = weekdaySchedules[dayOfWeek];

  if (!templates) return []; // Weekend

  const today = new Date();
  const isToday = isSameDay(date, today);
  const isPast = date < today && !isToday;

  return templates.map((t, i) => ({
    ...t,
    id: `lec-${dayOfWeek}-${i}`,
    // Deterministic statuses for past dates
    status: isPast
      ? ((i + dayOfWeek) % 7 === 0 ? "cancelled" : (i + dayOfWeek) % 5 === 0 ? "absent" : "present")
      : isToday
      ? (i < 2 ? "present" : null)
      : null,
  }));
}
