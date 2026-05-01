import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type USN = string;
export interface StudentResults {
    cgpa: number;
    student: Student;
    allSemesterResults: Array<SemesterResults>;
}
export interface SemesterResult {
    totalMarks: bigint;
    credits: bigint;
    internalMarks: bigint;
    subjectCode: SubjectCode;
    subjectName: string;
    gradePoints: bigint;
    grade: string;
    externalMarks: bigint;
}
export type SubjectCode = string;
export type Semester = bigint;
export interface SemesterResults {
    semester: Semester;
    sgpa: number;
    results: Array<SemesterResult>;
}
export interface UserProfile {
    usn?: USN;
    name: string;
}
export interface Student {
    dob: string;
    usn: USN;
    name: string;
    currentSemester: Semester;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addOrUpdateResult(usn: USN, semester: Semester, subjectCode: SubjectCode, subjectName: string, internalMarks: bigint, externalMarks: bigint, credits: bigint): Promise<void>;
    addStudent(student: Student): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteResult(usn: USN, semester: Semester, subjectCode: SubjectCode): Promise<void>;
    deleteStudent(usn: USN): Promise<void>;
    getAllStudents(): Promise<Array<Student>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSemesterResults(usn: USN, semester: Semester): Promise<SemesterResults>;
    getStudentResults(usn: USN): Promise<StudentResults>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    studentLogin(usn: USN, name: string): Promise<boolean>;
    updateStudent(student: Student): Promise<void>;
}
