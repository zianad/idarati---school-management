

import { TranslationKey } from '../i18n/index.ts';

export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  SchoolOwner = 'SchoolOwner',
  Staff = 'Staff',
}

export interface User {
  name: string;
  role: UserRole;
  schoolId?: string;
}

export interface CafeteriaPayment {
  id: string;
  studentId: string;
  // Array of YYYY-MM-DD dates
  dates: string[];
  amount: number;
  // YYYY-MM-DD HH:mm:ss
  paymentDate: string;
}

export interface CafeteriaUsage {
  studentId: string;
  date: string; // YYYY-MM-DD
}

export interface Student {
  id: string;
  name:string;
  parentPhone: string;
  levelId: string;
  groupIds: string[];
  subjectIds: string[];
  courseIds?: string[];
  registrationDate: string; 
  schoolName?: string;
  hasTransportation?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  fee: number;
  classroom: string; // Default classroom
  levelId: string;
  color?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  levelIds?: string[];
  courseIds?: string[];
  phone: string;
  salary: {
    type: 'fixed' | 'percentage' | 'per_session';
    value: number;
  };
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'admin' | 'driver';
  salary: number;
}


export interface Level {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  levelId: string;
}

export interface Course {
  id: string;
  name: string;
  fee: number;
  teacherIds?: string[];
  color?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string; // YYYY-MM
  courseId?: string; // For special courses
  description?: string;
}

export interface Expense {
  id:string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  teacherId?: string;
  category?: 'salary' | 'cafeteria' | 'transport' | 'other';
}

export interface ScheduledSession {
  id: string;
  groupId: string;
  subjectId?: string;
  courseId?: string;
  day: string;
  timeSlot: string;
  classroom: string;
  duration: number; // in minutes
}

export enum AttendanceStatus {
  Present = 'present',
  Absent = 'absent',
  Late = 'late',
  Excused = 'excused',
}

export interface Attendance {
  id: string;
  studentId: string;
  sessionId: string; // ID of the ScheduledSession
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface School {
  id: string;
  name: string;
  logo: string;
  ownerCode: string;
  staffCode: string;
  isActive: boolean;
  trialEndDate?: string; // YYYY-MM-DD
  students: Student[];
  teachers: Teacher[];
  staff: StaffMember[];
  levels: Level[];
  groups: Group[];
  courses: Course[];
  subjects: Subject[];
  payments: Payment[];
  expenses: Expense[];
  scheduledSessions: ScheduledSession[];
  attendance: Attendance[];
  transportationFee: number;
  cafeteriaDailyFee: number;
  cafeteriaPayments: CafeteriaPayment[];
  cafeteriaUsage: CafeteriaUsage[];
}

export interface AppContextType {
  schools: School[];
  currentUser: User | null;
  originalUser: User | null;
  login: (code: string) => { success: boolean; messageKey?: TranslationKey };
  logout: () => void;
  addSchool: (schoolDetails: { name: string; logo: string; ownerCode: string; staffCode: string; trialDays: number; }) => void;
  deleteSchool: (schoolId: string) => void;
  toggleSchoolStatus: (schoolId: string) => void;
  activateSchoolPermanently: (schoolId: string) => void;
  updateSchoolDetails: (schoolId: string, details: { name: string; logo: string; }) => void;
  updateSchoolCodes: (schoolId: string, codes: { ownerCode: string; staffCode: string; }) => void;
  impersonateSchoolOwner: (schoolId: string) => void;
  stopImpersonating: () => void;
  
  // School-specific functions
  findSchool: (schoolId: string) => School | undefined;
  updateSchoolFees: (schoolId: string, fees: { transportationFee: number; cafeteriaDailyFee: number; }) => void;
  addStudent: (schoolId: string, student: Omit<Student, 'id' | 'registrationDate'>) => void;
  addStudentsBulk: (schoolId: string, students: Omit<Student, 'id' | 'registrationDate'>[]) => void;
  updateStudent: (schoolId: string, student: Student) => void;
  deleteStudent: (schoolId: string, studentId: string) => void;
  addTeacher: (schoolId: string, teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (schoolId: string, teacher: Teacher) => void;
  deleteTeacher: (schoolId: string, teacherId: string) => void;
  addStaffMember: (schoolId: string, staffMember: Omit<StaffMember, 'id'>) => void;
  updateStaffMember: (schoolId: string, staffMember: StaffMember) => void;
  deleteStaffMember: (schoolId: string, staffMemberId: string) => void;
  addLevel: (schoolId: string, level: Omit<Level, 'id'>) => void;
  deleteLevel: (schoolId: string, levelId: string) => void;
  addGroup: (schoolId: string, group: Omit<Group, 'id'>) => void;
  deleteGroup: (schoolId: string, groupId: string) => void;
  addCourse: (schoolId: string, course: Omit<Course, 'id' | 'color'> & { color?: string }, sessionData?: { day: string; timeSlot: string; classroom: string; duration: number; groupId: string }[]) => void;
  updateCourse: (schoolId: string, course: Course) => void;
  deleteCourse: (schoolId: string, courseId: string) => void;
  addSubject: (schoolId: string, subject: Omit<Subject, 'id' | 'color'> & { color?: string }, sessionData?: { day: string; timeSlot: string; classroom: string; duration: number; groupId: string }[]) => void;
  updateSubject: (schoolId: string, subject: Subject) => void;
  deleteSubject: (schoolId: string, subjectId: string) => void;
  addExpense: (schoolId: string, expense: Omit<Expense, 'id'>) => void;
  addPayment: (schoolId: string, payment: Omit<Payment, 'id'>) => void;
  addCafeteriaPayment: (schoolId: string, payment: Omit<CafeteriaPayment, 'id' | 'paymentDate' | 'amount'>) => void;
  updateSchedule: (schoolId: string, sessions: ScheduledSession[]) => void;
  recordAttendance: (schoolId: string, records: Omit<Attendance, 'id'>[]) => void;
  recordCafeteriaUsage: (schoolId: string, studentIds: string[], date: string) => void;
  restoreData: (data: { schools: School[] }) => void;
}