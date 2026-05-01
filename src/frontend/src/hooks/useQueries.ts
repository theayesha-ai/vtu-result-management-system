import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
/**
 * React Query hooks for backend API calls.
 * All query functions follow the pattern: actor check → backend call → return data.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Student, StudentResults } from "../types";

// ─── Backend actor interface (methods may or may not exist at runtime) ─
// Cast to this when calling backend methods; failures fall back to seed data.
interface BackendActor {
  getStudentResults(usn: string): Promise<StudentResults>;
  getAllStudents(): Promise<Student[]>;
  isCallerAdmin(): Promise<boolean>;
  addStudent(student: Student): Promise<void>;
  updateStudent(student: Student): Promise<void>;
  deleteStudent(usn: string): Promise<void>;
  addOrUpdateResult(...args: unknown[]): Promise<void>;
  deleteResult(
    usn: string,
    semester: bigint,
    subjectCode: string,
  ): Promise<void>;
}

function toBackendActor(actor: unknown): BackendActor {
  return actor as BackendActor;
}

// ─── Seeded mock student data ─────────────────────────────────────
// Hardcoded fallback for USN 4MU24EC024 / Dimple S when the backend
// doesn't yet have this student (e.g., on first deploy before admin seeding).
const DIMPLE_SEED: StudentResults = {
  student: {
    usn: "4MU24EC024",
    name: "Dimple S",
    dob: "2000-01-01",
    currentSemester: BigInt(3),
  },
  // SGPA = (7*4+9*4+10*4+7*4+9*2+10*1+10*1+10*2+8*3) / (4+4+4+4+2+1+1+2+3) = 214/25 = 8.56
  cgpa: 8.56,
  allSemesterResults: [
    {
      semester: BigInt(3),
      sgpa: 8.56,
      results: [
        {
          subjectCode: "BMATEC301",
          subjectName: "AV Mathematics-III for EC Engineering",
          internalMarks: BigInt(42),
          externalMarks: BigInt(26),
          totalMarks: BigInt(68),
          grade: "C",
          gradePoints: BigInt(7),
          credits: BigInt(4),
        },
        {
          subjectCode: "BEC302",
          subjectName: "Digital System Design Using Verilog",
          internalMarks: BigInt(44),
          externalMarks: BigInt(36),
          totalMarks: BigInt(80),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BEC303",
          subjectName: "Electronic Principles and Circuits",
          internalMarks: BigInt(49),
          externalMarks: BigInt(41),
          totalMarks: BigInt(90),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(4),
        },
        {
          subjectCode: "BEC304",
          subjectName: "Network Analysis",
          internalMarks: BigInt(42),
          externalMarks: BigInt(19),
          totalMarks: BigInt(61),
          grade: "C",
          gradePoints: BigInt(7),
          credits: BigInt(4),
        },
        {
          subjectCode: "BECL305",
          subjectName: "Analog and Digital Systems Design Lab",
          internalMarks: BigInt(43),
          externalMarks: BigInt(45),
          totalMarks: BigInt(88),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(2),
        },
        {
          subjectCode: "BSCK307",
          subjectName: "Social Connect and Responsibility",
          internalMarks: BigInt(95),
          externalMarks: BigInt(0),
          totalMarks: BigInt(95),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(1),
        },
        {
          subjectCode: "BNSK359",
          subjectName: "National Service Scheme",
          internalMarks: BigInt(95),
          externalMarks: BigInt(0),
          totalMarks: BigInt(95),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(1),
        },
        {
          subjectCode: "BEC358A",
          subjectName: "LabView Programming",
          internalMarks: BigInt(50),
          externalMarks: BigInt(47),
          totalMarks: BigInt(97),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(2),
        },
        {
          subjectCode: "BEC306C",
          subjectName: "Computer Organization and Architecture",
          internalMarks: BigInt(49),
          externalMarks: BigInt(26),
          totalMarks: BigInt(75),
          grade: "B",
          gradePoints: BigInt(8),
          credits: BigInt(3),
        },
      ],
    },
  ],
};

// Seed data for KEERTHANA (4MU24EC034) — Semester 3
const KEERTHANA_SEED: StudentResults = {
  student: {
    usn: "4MU24EC034",
    name: "KEERTHANA",
    dob: "2000-01-01",
    currentSemester: BigInt(3),
  },
  cgpa: 7.56,
  allSemesterResults: [
    {
      semester: BigInt(3),
      sgpa: 7.56,
      results: [
        {
          subjectCode: "BMATEC301",
          subjectName: "AV Mathematics III for EC",
          internalMarks: BigInt(43),
          externalMarks: BigInt(20),
          totalMarks: BigInt(63),
          grade: "C",
          gradePoints: BigInt(7),
          credits: BigInt(4),
        },
        {
          subjectCode: "BEC302",
          subjectName: "Digital System Design Using Verilog",
          internalMarks: BigInt(42),
          externalMarks: BigInt(35),
          totalMarks: BigInt(77),
          grade: "B",
          gradePoints: BigInt(8),
          credits: BigInt(4),
        },
        {
          subjectCode: "BEC303",
          subjectName: "Electronic Principles and Circuits",
          internalMarks: BigInt(45),
          externalMarks: BigInt(20),
          totalMarks: BigInt(65),
          grade: "C",
          gradePoints: BigInt(7),
          credits: BigInt(4),
        },
        {
          subjectCode: "BEC304",
          subjectName: "Network Analysis",
          internalMarks: BigInt(35),
          externalMarks: BigInt(18),
          totalMarks: BigInt(53),
          grade: "E",
          gradePoints: BigInt(5),
          credits: BigInt(4),
        },
        {
          subjectCode: "BECL305",
          subjectName: "Analog and Digital Systems Design Lab",
          internalMarks: BigInt(46),
          externalMarks: BigInt(44),
          totalMarks: BigInt(90),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(2),
        },
        {
          subjectCode: "BSCK307",
          subjectName: "Social Connect and Responsibility",
          internalMarks: BigInt(96),
          externalMarks: BigInt(0),
          totalMarks: BigInt(96),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(1),
        },
        {
          subjectCode: "BNSK359",
          subjectName: "National Service Scheme",
          internalMarks: BigInt(95),
          externalMarks: BigInt(0),
          totalMarks: BigInt(95),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(1),
        },
        {
          subjectCode: "BEC358A",
          subjectName: "Labview Programming",
          internalMarks: BigInt(50),
          externalMarks: BigInt(49),
          totalMarks: BigInt(99),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(2),
        },
        {
          subjectCode: "BEC306C",
          subjectName: "Computer Organization and Architecture",
          internalMarks: BigInt(49),
          externalMarks: BigInt(25),
          totalMarks: BigInt(74),
          grade: "B",
          gradePoints: BigInt(8),
          credits: BigInt(3),
        },
      ],
    },
  ],
};

// ─── CI Branch Seed Data (Semester 3) ────────────────────────────
// Subjects: BCS301(4cr), BCS302(4cr), BCS303(3cr), BCS304(4cr),
//           BCSL305(2cr), BSCK307(1cr), BCS306A(3cr), BCS358A(2cr)
// Total credits = 23. SGPA = sum(grade_pts * credits) / 23

// Student 1: Aditiya KS — 4MO24CI001
// Totals: 91,88,85,86,94,98,97,95 → S,A,A,A,S,S,S,S
// GP*cr: 10*4+9*4+9*3+9*4+10*2+10*1+10*3+10*2 = 40+36+27+36+20+10+30+20 = 219 / 23 = 9.52
const ADITIYA_SEED: StudentResults = {
  student: {
    usn: "4MO24CI001",
    name: "Aditiya ks",
    dob: "2000-01-01",
    currentSemester: BigInt(3),
  },
  cgpa: 9.52,
  allSemesterResults: [
    {
      semester: BigInt(3),
      sgpa: 9.52,
      results: [
        {
          subjectCode: "BCS301",
          subjectName: "Mathematics for CS",
          internalMarks: BigInt(46),
          externalMarks: BigInt(45),
          totalMarks: BigInt(91),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS302",
          subjectName: "Digital Design & Computer Organization",
          internalMarks: BigInt(45),
          externalMarks: BigInt(43),
          totalMarks: BigInt(88),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS303",
          subjectName: "Operating Systems",
          internalMarks: BigInt(44),
          externalMarks: BigInt(41),
          totalMarks: BigInt(85),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS304",
          subjectName: "Data Structures and Applications",
          internalMarks: BigInt(45),
          externalMarks: BigInt(41),
          totalMarks: BigInt(86),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCSL305",
          subjectName: "Data Structures Lab",
          internalMarks: BigInt(47),
          externalMarks: BigInt(47),
          totalMarks: BigInt(94),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(2),
        },
        {
          subjectCode: "BSCK307",
          subjectName: "Social Connect and Responsibility",
          internalMarks: BigInt(98),
          externalMarks: BigInt(0),
          totalMarks: BigInt(98),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(1),
        },
        {
          subjectCode: "BCS306A",
          subjectName: "OOP with Java",
          internalMarks: BigInt(49),
          externalMarks: BigInt(48),
          totalMarks: BigInt(97),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS358A",
          subjectName: "Data Analytics with Excel",
          internalMarks: BigInt(48),
          externalMarks: BigInt(47),
          totalMarks: BigInt(95),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(2),
        },
      ],
    },
  ],
};

// Student 2: Afza Fathima — 4MO24CI002
// Totals: 55,52,57,57,60,78,55,55 → C,D,C,C,B,B+,C,C
// GP*cr: 6*4+5*4+6*3+6*4+7*2+8*1+6*3+6*2 = 24+20+18+24+14+8+18+12 = 138 / 23 = 6.00
const AFZA_SEED: StudentResults = {
  student: {
    usn: "4MO24CI002",
    name: "Afza Fathima",
    dob: "2000-01-01",
    currentSemester: BigInt(3),
  },
  cgpa: 6.0,
  allSemesterResults: [
    {
      semester: BigInt(3),
      sgpa: 6.0,
      results: [
        {
          subjectCode: "BCS301",
          subjectName: "Mathematics for CS",
          internalMarks: BigInt(28),
          externalMarks: BigInt(27),
          totalMarks: BigInt(55),
          grade: "C",
          gradePoints: BigInt(6),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS302",
          subjectName: "Digital Design & Computer Organization",
          internalMarks: BigInt(27),
          externalMarks: BigInt(25),
          totalMarks: BigInt(52),
          grade: "D",
          gradePoints: BigInt(5),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS303",
          subjectName: "Operating Systems",
          internalMarks: BigInt(30),
          externalMarks: BigInt(27),
          totalMarks: BigInt(57),
          grade: "C",
          gradePoints: BigInt(6),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS304",
          subjectName: "Data Structures and Applications",
          internalMarks: BigInt(29),
          externalMarks: BigInt(28),
          totalMarks: BigInt(57),
          grade: "C",
          gradePoints: BigInt(6),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCSL305",
          subjectName: "Data Structures Lab",
          internalMarks: BigInt(31),
          externalMarks: BigInt(29),
          totalMarks: BigInt(60),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(2),
        },
        {
          subjectCode: "BSCK307",
          subjectName: "Social Connect and Responsibility",
          internalMarks: BigInt(78),
          externalMarks: BigInt(0),
          totalMarks: BigInt(78),
          grade: "B+",
          gradePoints: BigInt(8),
          credits: BigInt(1),
        },
        {
          subjectCode: "BCS306A",
          subjectName: "OOP with Java",
          internalMarks: BigInt(28),
          externalMarks: BigInt(27),
          totalMarks: BigInt(55),
          grade: "C",
          gradePoints: BigInt(6),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS358A",
          subjectName: "Data Analytics with Excel",
          internalMarks: BigInt(28),
          externalMarks: BigInt(27),
          totalMarks: BigInt(55),
          grade: "C",
          gradePoints: BigInt(6),
          credits: BigInt(2),
        },
      ],
    },
  ],
};

// Student 3: Ankita BT — 4MO24CI003
// Totals: 83,73,75,82,85,78,74,80 → A,B+,B+,A,A,B+,B+,A
// GP*cr: 9*4+8*4+8*3+9*4+9*2+8*1+8*3+9*2 = 36+32+24+36+18+8+24+18 = 196 / 23 = 8.52
const ANKITA_BT_SEED: StudentResults = {
  student: {
    usn: "4MO24CI003",
    name: "Ankita BT",
    dob: "2000-01-01",
    currentSemester: BigInt(3),
  },
  cgpa: 8.52,
  allSemesterResults: [
    {
      semester: BigInt(3),
      sgpa: 8.52,
      results: [
        {
          subjectCode: "BCS301",
          subjectName: "Mathematics for CS",
          internalMarks: BigInt(42),
          externalMarks: BigInt(41),
          totalMarks: BigInt(83),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS302",
          subjectName: "Digital Design & Computer Organization",
          internalMarks: BigInt(37),
          externalMarks: BigInt(36),
          totalMarks: BigInt(73),
          grade: "B+",
          gradePoints: BigInt(8),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS303",
          subjectName: "Operating Systems",
          internalMarks: BigInt(38),
          externalMarks: BigInt(37),
          totalMarks: BigInt(75),
          grade: "B+",
          gradePoints: BigInt(8),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS304",
          subjectName: "Data Structures and Applications",
          internalMarks: BigInt(41),
          externalMarks: BigInt(41),
          totalMarks: BigInt(82),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCSL305",
          subjectName: "Data Structures Lab",
          internalMarks: BigInt(43),
          externalMarks: BigInt(42),
          totalMarks: BigInt(85),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(2),
        },
        {
          subjectCode: "BSCK307",
          subjectName: "Social Connect and Responsibility",
          internalMarks: BigInt(78),
          externalMarks: BigInt(0),
          totalMarks: BigInt(78),
          grade: "B+",
          gradePoints: BigInt(8),
          credits: BigInt(1),
        },
        {
          subjectCode: "BCS306A",
          subjectName: "OOP with Java",
          internalMarks: BigInt(37),
          externalMarks: BigInt(37),
          totalMarks: BigInt(74),
          grade: "B+",
          gradePoints: BigInt(8),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS358A",
          subjectName: "Data Analytics with Excel",
          internalMarks: BigInt(41),
          externalMarks: BigInt(39),
          totalMarks: BigInt(80),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(2),
        },
      ],
    },
  ],
};

// Student 4: Ankita B — 4MO24CI004
// Totals: 87,90,83,89,95,98,92,88 → A,S,A,A,S,S,S,A
// GP*cr: 9*4+10*4+9*3+9*4+10*2+10*1+10*3+9*2 = 36+40+27+36+20+10+30+18 = 217 / 23 = 9.43
const ANKITA_B_SEED: StudentResults = {
  student: {
    usn: "4MO24CI004",
    name: "Ankita B",
    dob: "2000-01-01",
    currentSemester: BigInt(3),
  },
  cgpa: 9.43,
  allSemesterResults: [
    {
      semester: BigInt(3),
      sgpa: 9.43,
      results: [
        {
          subjectCode: "BCS301",
          subjectName: "Mathematics for CS",
          internalMarks: BigInt(44),
          externalMarks: BigInt(43),
          totalMarks: BigInt(87),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS302",
          subjectName: "Digital Design & Computer Organization",
          internalMarks: BigInt(46),
          externalMarks: BigInt(44),
          totalMarks: BigInt(90),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS303",
          subjectName: "Operating Systems",
          internalMarks: BigInt(43),
          externalMarks: BigInt(40),
          totalMarks: BigInt(83),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS304",
          subjectName: "Data Structures and Applications",
          internalMarks: BigInt(46),
          externalMarks: BigInt(43),
          totalMarks: BigInt(89),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCSL305",
          subjectName: "Data Structures Lab",
          internalMarks: BigInt(48),
          externalMarks: BigInt(47),
          totalMarks: BigInt(95),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(2),
        },
        {
          subjectCode: "BSCK307",
          subjectName: "Social Connect and Responsibility",
          internalMarks: BigInt(98),
          externalMarks: BigInt(0),
          totalMarks: BigInt(98),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(1),
        },
        {
          subjectCode: "BCS306A",
          subjectName: "OOP with Java",
          internalMarks: BigInt(47),
          externalMarks: BigInt(45),
          totalMarks: BigInt(92),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS358A",
          subjectName: "Data Analytics with Excel",
          internalMarks: BigInt(45),
          externalMarks: BigInt(43),
          totalMarks: BigInt(88),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(2),
        },
      ],
    },
  ],
};

// Student 5: Bibi Ayesha — 4MO24CI005
// Totals: 62,60,65,60,65,77,60,60 → B,B,B,B,B,B+,B,B
// GP*cr: 7*4+7*4+7*3+7*4+7*2+8*1+7*3+7*2 = 28+28+21+28+14+8+21+14 = 162 / 23 = 7.04
const BIBI_SEED: StudentResults = {
  student: {
    usn: "4MO24CI005",
    name: "Bibi Ayesha",
    dob: "2000-01-01",
    currentSemester: BigInt(3),
  },
  cgpa: 7.04,
  allSemesterResults: [
    {
      semester: BigInt(3),
      sgpa: 7.04,
      results: [
        {
          subjectCode: "BCS301",
          subjectName: "Mathematics for CS",
          internalMarks: BigInt(32),
          externalMarks: BigInt(30),
          totalMarks: BigInt(62),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS302",
          subjectName: "Digital Design & Computer Organization",
          internalMarks: BigInt(31),
          externalMarks: BigInt(29),
          totalMarks: BigInt(60),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS303",
          subjectName: "Operating Systems",
          internalMarks: BigInt(33),
          externalMarks: BigInt(32),
          totalMarks: BigInt(65),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS304",
          subjectName: "Data Structures and Applications",
          internalMarks: BigInt(31),
          externalMarks: BigInt(29),
          totalMarks: BigInt(60),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCSL305",
          subjectName: "Data Structures Lab",
          internalMarks: BigInt(33),
          externalMarks: BigInt(32),
          totalMarks: BigInt(65),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(2),
        },
        {
          subjectCode: "BSCK307",
          subjectName: "Social Connect and Responsibility",
          internalMarks: BigInt(77),
          externalMarks: BigInt(0),
          totalMarks: BigInt(77),
          grade: "B+",
          gradePoints: BigInt(8),
          credits: BigInt(1),
        },
        {
          subjectCode: "BCS306A",
          subjectName: "OOP with Java",
          internalMarks: BigInt(31),
          externalMarks: BigInt(29),
          totalMarks: BigInt(60),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS358A",
          subjectName: "Data Analytics with Excel",
          internalMarks: BigInt(31),
          externalMarks: BigInt(29),
          totalMarks: BigInt(60),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(2),
        },
      ],
    },
  ],
};

// Student 6: Deepika C — 4MO24CI006
// Totals: 88,91,87,85,92,97,94,90 → A,S,A,A,S,S,S,S
// GP*cr: 9*4+10*4+9*3+9*4+10*2+10*1+10*3+10*2 = 36+40+27+36+20+10+30+20 = 219 / 23 = 9.52
const DEEPIKA_SEED: StudentResults = {
  student: {
    usn: "4MO24CI006",
    name: "Deepika C",
    dob: "2000-01-01",
    currentSemester: BigInt(3),
  },
  cgpa: 9.52,
  allSemesterResults: [
    {
      semester: BigInt(3),
      sgpa: 9.52,
      results: [
        {
          subjectCode: "BCS301",
          subjectName: "Mathematics for CS",
          internalMarks: BigInt(45),
          externalMarks: BigInt(43),
          totalMarks: BigInt(88),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS302",
          subjectName: "Digital Design & Computer Organization",
          internalMarks: BigInt(47),
          externalMarks: BigInt(44),
          totalMarks: BigInt(91),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS303",
          subjectName: "Operating Systems",
          internalMarks: BigInt(44),
          externalMarks: BigInt(43),
          totalMarks: BigInt(87),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS304",
          subjectName: "Data Structures and Applications",
          internalMarks: BigInt(44),
          externalMarks: BigInt(41),
          totalMarks: BigInt(85),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCSL305",
          subjectName: "Data Structures Lab",
          internalMarks: BigInt(47),
          externalMarks: BigInt(45),
          totalMarks: BigInt(92),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(2),
        },
        {
          subjectCode: "BSCK307",
          subjectName: "Social Connect and Responsibility",
          internalMarks: BigInt(97),
          externalMarks: BigInt(0),
          totalMarks: BigInt(97),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(1),
        },
        {
          subjectCode: "BCS306A",
          subjectName: "OOP with Java",
          internalMarks: BigInt(48),
          externalMarks: BigInt(46),
          totalMarks: BigInt(94),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS358A",
          subjectName: "Data Analytics with Excel",
          internalMarks: BigInt(46),
          externalMarks: BigInt(44),
          totalMarks: BigInt(90),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(2),
        },
      ],
    },
  ],
};

// Student 7: Divya B — 4MO24CI007
// Totals: 86,93,90,84,91,96,89,95 → A,S,S,A,S,S,A,S
// GP*cr: 9*4+10*4+10*3+9*4+10*2+10*1+9*3+10*2 = 36+40+30+36+20+10+27+20 = 219 / 23 = 9.52
const DIVYA_SEED: StudentResults = {
  student: {
    usn: "4MO24CI007",
    name: "Divya B",
    dob: "2000-01-01",
    currentSemester: BigInt(3),
  },
  cgpa: 9.52,
  allSemesterResults: [
    {
      semester: BigInt(3),
      sgpa: 9.52,
      results: [
        {
          subjectCode: "BCS301",
          subjectName: "Mathematics for CS",
          internalMarks: BigInt(44),
          externalMarks: BigInt(42),
          totalMarks: BigInt(86),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS302",
          subjectName: "Digital Design & Computer Organization",
          internalMarks: BigInt(48),
          externalMarks: BigInt(45),
          totalMarks: BigInt(93),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS303",
          subjectName: "Operating Systems",
          internalMarks: BigInt(46),
          externalMarks: BigInt(44),
          totalMarks: BigInt(90),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS304",
          subjectName: "Data Structures and Applications",
          internalMarks: BigInt(43),
          externalMarks: BigInt(41),
          totalMarks: BigInt(84),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCSL305",
          subjectName: "Data Structures Lab",
          internalMarks: BigInt(46),
          externalMarks: BigInt(45),
          totalMarks: BigInt(91),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(2),
        },
        {
          subjectCode: "BSCK307",
          subjectName: "Social Connect and Responsibility",
          internalMarks: BigInt(96),
          externalMarks: BigInt(0),
          totalMarks: BigInt(96),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(1),
        },
        {
          subjectCode: "BCS306A",
          subjectName: "OOP with Java",
          internalMarks: BigInt(46),
          externalMarks: BigInt(43),
          totalMarks: BigInt(89),
          grade: "A",
          gradePoints: BigInt(9),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS358A",
          subjectName: "Data Analytics with Excel",
          internalMarks: BigInt(48),
          externalMarks: BigInt(47),
          totalMarks: BigInt(95),
          grade: "S",
          gradePoints: BigInt(10),
          credits: BigInt(2),
        },
      ],
    },
  ],
};

// Student 8: Ameen Baig — 4MN24CI002
// Totals: 68,63,60,70,65,78,62,60 → B,B,B,B+,B,B+,B,B
// GP*cr: 7*4+7*4+7*3+8*4+7*2+8*1+7*3+7*2 = 28+28+21+32+14+8+21+14 = 166 / 23 = 7.22
const AMEEN_SEED: StudentResults = {
  student: {
    usn: "4MN24CI002",
    name: "Ameen Baig",
    dob: "2000-01-01",
    currentSemester: BigInt(3),
  },
  cgpa: 7.22,
  allSemesterResults: [
    {
      semester: BigInt(3),
      sgpa: 7.22,
      results: [
        {
          subjectCode: "BCS301",
          subjectName: "Mathematics for CS",
          internalMarks: BigInt(34),
          externalMarks: BigInt(34),
          totalMarks: BigInt(68),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS302",
          subjectName: "Digital Design & Computer Organization",
          internalMarks: BigInt(32),
          externalMarks: BigInt(31),
          totalMarks: BigInt(63),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCS303",
          subjectName: "Operating Systems",
          internalMarks: BigInt(31),
          externalMarks: BigInt(29),
          totalMarks: BigInt(60),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS304",
          subjectName: "Data Structures and Applications",
          internalMarks: BigInt(35),
          externalMarks: BigInt(35),
          totalMarks: BigInt(70),
          grade: "B+",
          gradePoints: BigInt(8),
          credits: BigInt(4),
        },
        {
          subjectCode: "BCSL305",
          subjectName: "Data Structures Lab",
          internalMarks: BigInt(33),
          externalMarks: BigInt(32),
          totalMarks: BigInt(65),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(2),
        },
        {
          subjectCode: "BSCK307",
          subjectName: "Social Connect and Responsibility",
          internalMarks: BigInt(78),
          externalMarks: BigInt(0),
          totalMarks: BigInt(78),
          grade: "B+",
          gradePoints: BigInt(8),
          credits: BigInt(1),
        },
        {
          subjectCode: "BCS306A",
          subjectName: "OOP with Java",
          internalMarks: BigInt(32),
          externalMarks: BigInt(30),
          totalMarks: BigInt(62),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(3),
        },
        {
          subjectCode: "BCS358A",
          subjectName: "Data Analytics with Excel",
          internalMarks: BigInt(31),
          externalMarks: BigInt(29),
          totalMarks: BigInt(60),
          grade: "B",
          gradePoints: BigInt(7),
          credits: BigInt(2),
        },
      ],
    },
  ],
};

// Registry of all seeded students (USN lowercase → seed)
const SEEDED_STUDENTS: Record<string, StudentResults> = {
  "4mu24ec024": DIMPLE_SEED,
  "4mu24ec034": KEERTHANA_SEED,
  "4mo24ci001": ADITIYA_SEED,
  "4mo24ci002": AFZA_SEED,
  "4mo24ci003": ANKITA_BT_SEED,
  "4mo24ci004": ANKITA_B_SEED,
  "4mo24ci005": BIBI_SEED,
  "4mo24ci006": DEEPIKA_SEED,
  "4mo24ci007": DIVYA_SEED,
  "4mn24ci002": AMEEN_SEED,
};

// ─── Student Queries ─────────────────────────────────────────────

/** Fetch all results for a given USN — used for student result display */
export function useStudentResults(usn: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["studentResults", usn],
    queryFn: async () => {
      if (!actor || !usn) throw new Error("Actor or USN not available");
      return toBackendActor(actor).getStudentResults(usn);
    },
    enabled: !!actor && !isFetching && !!usn,
    staleTime: 30_000,
  });
}

/** Check if a USN + name combination exists (student "login") */
export function useStudentLogin() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async ({ usn, name }: { usn: string; name: string }) => {
      if (!actor) throw new Error("Service not ready");

      try {
        // Fetch the student's results and verify name matches
        const results = await toBackendActor(actor).getStudentResults(usn);
        if (!results || !results.student) throw new Error("Student not found");
        const storedName = results.student.name.trim().toLowerCase();
        const enteredName = name.trim().toLowerCase();
        if (storedName !== enteredName)
          throw new Error("Name does not match our records");
        return results;
      } catch (err: unknown) {
        // If the backend call fails, fall back to seeded mock data.
        const usnKey = usn.toLowerCase();
        const nameNorm = name.trim().toLowerCase();
        const seed = SEEDED_STUDENTS[usnKey];

        if (seed && seed.student.name.toLowerCase() === nameNorm) {
          return seed;
        }

        // Re-throw with a clearer message for all other students
        const originalMsg = err instanceof Error ? err.message : "Unauthorized";
        // Preserve "Name does not match" errors as-is
        if (originalMsg.toLowerCase().includes("name")) throw err;
        throw new Error("Unauthorized: You can only view your own results");
      }
    },
  });
}

// ─── Admin Queries ───────────────────────────────────────────────

/** Fetch all students — admin use */
export function useAllStudents() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["allStudents"],
    queryFn: async () => {
      if (!actor) return [];
      return toBackendActor(actor).getAllStudents();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

/** Check if the current caller is an admin */
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return toBackendActor(actor).isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

// ─── Admin Mutations ─────────────────────────────────────────────

/** Add a new student */
export function useAddStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (student: Student) => {
      if (!actor) throw new Error("Service not ready");
      return toBackendActor(actor).addStudent(student);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["allStudents"] }),
  });
}

/** Update an existing student */
export function useUpdateStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (student: Student) => {
      if (!actor) throw new Error("Service not ready");
      return toBackendActor(actor).updateStudent(student);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["allStudents"] }),
  });
}

/** Delete a student by USN */
export function useDeleteStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (usn: string) => {
      if (!actor) throw new Error("Service not ready");
      return toBackendActor(actor).deleteStudent(usn);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["allStudents"] }),
  });
}

/** Add or update a subject result */
export function useAddOrUpdateResult() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      usn,
      semester,
      subjectCode,
      subjectName,
      internalMarks,
      externalMarks,
      credits,
      announcedOn,
    }: {
      usn: string;
      semester: number;
      subjectCode: string;
      subjectName: string;
      internalMarks: number;
      externalMarks: number;
      credits: number;
      announcedOn?: string;
    }) => {
      if (!actor) throw new Error("Service not ready");
      const dateStr = announcedOn ?? new Date().toISOString().split("T")[0];
      return toBackendActor(actor).addOrUpdateResult(
        usn,
        BigInt(semester),
        subjectCode,
        subjectName,
        BigInt(internalMarks),
        BigInt(externalMarks),
        BigInt(credits),
        dateStr,
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["studentResults", vars.usn] });
      queryClient.invalidateQueries({
        queryKey: ["marksForStudent", vars.usn],
      });
    },
  });
}

/** Delete a subject result */
export function useDeleteResult() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      usn,
      semester,
      subjectCode,
    }: {
      usn: string;
      semester: bigint;
      subjectCode: string;
    }) => {
      if (!actor) throw new Error("Service not ready");
      return toBackendActor(actor).deleteResult(usn, semester, subjectCode);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["studentResults", vars.usn] });
      queryClient.invalidateQueries({
        queryKey: ["marksForStudent", vars.usn],
      });
    },
  });
}

/** Fetch results for a specific student (admin marks management) */
export function useStudentResultsAdmin(usn: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["marksForStudent", usn],
    queryFn: async () => {
      if (!actor || !usn) return null;
      return toBackendActor(actor).getStudentResults(usn);
    },
    enabled: !!actor && !isFetching && !!usn,
    staleTime: 10_000,
  });
}
