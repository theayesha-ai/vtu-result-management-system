/**
 * Local type definitions for the VTU Result Management System.
 * These are maintained here because the backend interface is minimal;
 * all student data lives in the frontend seed layer.
 */

export interface Student {
  usn: string;
  name: string;
  dob: string;
  currentSemester: bigint;
}

export interface SemesterResult {
  subjectCode: string;
  subjectName: string;
  internalMarks: bigint;
  externalMarks: bigint;
  totalMarks: bigint;
  grade: string;
  gradePoints: bigint;
  credits: bigint;
}

export interface SemesterResults {
  semester: bigint;
  sgpa: number;
  results: SemesterResult[];
}

export interface StudentResults {
  student: Student;
  cgpa: number;
  allSemesterResults: SemesterResults[];
}
