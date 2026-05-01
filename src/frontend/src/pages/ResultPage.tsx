import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
/**
 * ResultPage — displays a student's complete academic record.
 * Shows: student info, per-semester result tables, SGPA, CGPA, and a bar chart.
 * Supports print-to-PDF via window.print().
 */
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Download,
  GraduationCap,
  LogOut,
  TrendingUp,
  Trophy,
  User,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppContext } from "../context/AppContext";
import type { SemesterResult, SemesterResults } from "../types";

// ─── Grade → CSS class mapping ───────────────────────────────────
function getGradeClass(grade: string): string {
  const map: Record<string, string> = {
    S: "grade-s",
    A: "grade-a",
    B: "grade-b",
    C: "grade-c",
    D: "grade-d",
    E: "grade-e",
    F: "grade-f",
  };
  return map[grade.toUpperCase()] ?? "";
}

// ─── SGPA badge color ─────────────────────────────────────────────
function getSgpaColor(sgpa: number): string {
  if (sgpa >= 9) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (sgpa >= 8) return "bg-blue-100 text-blue-800 border-blue-200";
  if (sgpa >= 7) return "bg-indigo-100 text-indigo-800 border-indigo-200";
  if (sgpa >= 6) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

// ─── Chart tooltip ────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-navy text-sm">
        <p className="font-semibold text-foreground">Semester {label}</p>
        <p className="text-primary">
          SGPA: <span className="font-bold">{payload[0].value.toFixed(2)}</span>
        </p>
      </div>
    );
  }
  return null;
}

// ─── Subject row component ────────────────────────────────────────
function SubjectRow({
  result,
  index,
  semester,
}: { result: SemesterResult; index: number; semester: number }) {
  const total = Number(result.totalMarks);
  const internal = Number(result.internalMarks);
  const external = Number(result.externalMarks);
  const gradeClass = getGradeClass(result.grade);

  // P/F result: pass if total >= 50
  const isPassed = total >= 50;
  const resultLabel = isPassed ? "P" : "F";

  // Announced On: show "2026-03-03" for semester 3, else "—"
  const announcedOn = semester === 3 ? "2026-03-03" : "—";

  return (
    <TableRow className={index % 2 === 0 ? "table-row-even" : "table-row-odd"}>
      <TableCell className="font-mono text-xs font-semibold text-primary">
        {result.subjectCode}
      </TableCell>
      <TableCell className="text-sm">{result.subjectName}</TableCell>
      <TableCell className="text-center text-sm">{internal}</TableCell>
      <TableCell className="text-center text-sm">{external}</TableCell>
      <TableCell className="text-center font-semibold text-sm">
        {total}
      </TableCell>
      <TableCell className="text-center">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${gradeClass}`}
        >
          {result.grade}
        </span>
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">
        {Number(result.credits)}
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">
        {Number(result.gradePoints)}
      </TableCell>
      <TableCell className="text-center">
        <span
          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
            isPassed
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          {resultLabel}
        </span>
      </TableCell>
      <TableCell className="text-center text-xs text-muted-foreground whitespace-nowrap">
        {announcedOn}
      </TableCell>
    </TableRow>
  );
}

// ─── Semester section ─────────────────────────────────────────────
function SemesterSection({ semResult }: { semResult: SemesterResults }) {
  const semNum = Number(semResult.semester);
  const sgpa = semResult.sgpa;
  const sgpaColor = getSgpaColor(sgpa);

  return (
    <div className="result-card border border-border rounded-lg overflow-hidden shadow-xs mb-6">
      {/* Semester header */}
      <div className="bg-primary/5 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {semNum}
          </div>
          <h3 className="font-display font-semibold text-foreground">
            Semester {semNum}
          </h3>
          <Badge variant="outline" className="text-xs ml-1">
            {semResult.results.length} Subjects
          </Badge>
        </div>
        <div
          className={`rounded-full border px-3 py-1 text-sm font-bold ${sgpaColor}`}
        >
          SGPA: {sgpa.toFixed(2)}
        </div>
      </div>

      {/* Results table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wide w-28">
                Code
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">
                Subject Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-center w-20">
                Internal
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-center w-20">
                External
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-center w-16">
                Total
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-center w-16">
                Grade
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-center w-16">
                Credits
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-center w-16">
                GP
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-center w-16">
                Result
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-center w-28">
                Announced On
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {semResult.results.map((r, idx) => (
              <SubjectRow
                key={r.subjectCode}
                result={r}
                index={idx}
                semester={semNum}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Semester footer */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          Total Credits:{" "}
          <strong className="text-foreground">
            {semResult.results.reduce((acc, r) => acc + Number(r.credits), 0)}
          </strong>
        </span>
        <span>
          Passed:{" "}
          <strong className="text-foreground">
            {semResult.results.filter((r) => r.grade !== "F").length}/
            {semResult.results.length}
          </strong>
        </span>
      </div>
    </div>
  );
}

// ─── Main ResultPage ──────────────────────────────────────────────
export default function ResultPage() {
  const navigate = useNavigate();
  const { studentResults, setStudentResults } = useAppContext();

  // Redirect if not logged in
  if (!studentResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          className="text-center space-y-4 max-w-sm mx-auto px-4"
          data-ocid="result.error_state"
        >
          <div className="text-5xl">🔒</div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Session Expired
          </h2>
          <p className="text-muted-foreground text-sm">
            Please log in with your USN and name to view your results.
          </p>
          <Button
            onClick={() => navigate({ to: "/" })}
            className="bg-primary text-primary-foreground"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const { student, cgpa, allSemesterResults } = studentResults;
  const sorted = [...allSemesterResults].sort(
    (a, b) => Number(a.semester) - Number(b.semester),
  );

  // Chart data
  const chartData = sorted.map((s) => ({
    sem: String(Number(s.semester)),
    sgpa: Number.parseFloat(s.sgpa.toFixed(2)),
  }));

  function handleLogout() {
    setStudentResults(null);
    navigate({ to: "/" });
  }

  function handleDownload() {
    window.print();
  }

  // CGPA color
  const cgpaDisplay = cgpa.toFixed(2);
  const cgpaColor =
    cgpa >= 9
      ? "text-emerald-600"
      : cgpa >= 8
        ? "text-blue-600"
        : cgpa >= 7
          ? "text-indigo-600"
          : cgpa >= 6
            ? "text-amber-600"
            : "text-red-600";

  return (
    <div className="min-h-screen bg-background">
      {/* ─── VTU Header (print-visible) ──────────────────────────── */}
      <header className="vtu-header-gradient text-white no-print">
        <div className="h-1 vtu-gold-accent" />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/vtu-emblem-transparent.dim_120x120.png"
                alt="VTU"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="font-display font-bold">VTU Result Portal</h1>
                <p className="text-xs text-white/60">Academic Results</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
                data-ocid="result.download.button"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
                data-ocid="result.logout.button"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Logout
              </Button>
            </div>
          </div>

          {/* ─── Welcome Banner ─────────────────────────────────── */}
          <div
            className="no-print mt-3 flex items-center gap-3 bg-white/10 rounded-full px-4 py-2 w-fit"
            data-ocid="result.student.panel"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">
              Welcome, {student.name}
            </span>
            <span className="text-white/30 select-none">·</span>
            <span className="font-mono text-xs text-white/80 tracking-wider">
              USN: {student.usn}
            </span>
          </div>
        </div>
      </header>

      {/* ─── Print-only header ───────────────────────────────────── */}
      <div className="print-only p-6 border-b-2 border-gray-800 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src="/assets/generated/vtu-emblem-transparent.dim_120x120.png"
            alt="VTU"
            className="w-14 h-14"
          />
          <div>
            <h1 className="text-xl font-bold">
              Visvesvaraya Technological University
            </h1>
            <p className="text-sm text-gray-600">
              Jnana Sangama, Belagavi — 590018
            </p>
          </div>
        </div>
        <h2 className="text-lg font-bold border-t border-gray-300 pt-2 mt-2">
          STATEMENT OF MARKS
        </h2>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* ─── Student Info Card ───────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl shadow-navy p-6 mb-8 animate-fade-in">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {student.name}
                </h2>
                <p className="font-mono text-sm text-primary font-semibold mt-0.5">
                  USN: {student.usn}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Current Semester:{" "}
                  <span className="font-semibold text-foreground">
                    {Number(student.currentSemester)}
                  </span>
                </p>
              </div>
            </div>

            {/* CGPA badge */}
            <div className="flex flex-col items-center bg-primary/5 border border-primary/20 rounded-xl px-6 py-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest mb-1">
                <Trophy className="w-3 h-3" />
                CGPA
              </div>
              <div className={`font-display text-4xl font-bold ${cgpaColor}`}>
                {cgpaDisplay}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Cumulative GPA
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex flex-wrap gap-6 mt-5 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm">
              <BookOpen className="w-4 h-4 text-gold" />
              <span className="text-muted-foreground">
                Semesters Completed:
              </span>
              <span className="font-semibold text-foreground">
                {sorted.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-4 h-4 text-gold" />
              <span className="text-muted-foreground">Total Subjects:</span>
              <span className="font-semibold text-foreground">
                {sorted.reduce((acc, s) => acc + s.results.length, 0)}
              </span>
            </div>
            {sorted.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Trophy className="w-4 h-4 text-gold" />
                <span className="text-muted-foreground">Best SGPA:</span>
                <span className="font-semibold text-foreground">
                  {Math.max(...sorted.map((s) => s.sgpa)).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Performance Chart ────────────────────────────────── */}
        {chartData.length > 0 && (
          <div className="bg-card border border-border rounded-xl shadow-xs p-6 mb-8 no-print animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">
                Semester Performance
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.02 250)"
                  vertical={false}
                />
                <XAxis
                  dataKey="sem"
                  tickFormatter={(v) => `Sem ${v}`}
                  tick={{ fontSize: 12, fill: "oklch(0.52 0.04 255)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tick={{ fontSize: 11, fill: "oklch(0.52 0.04 255)" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine
                  y={8}
                  stroke="oklch(0.72 0.16 75)"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Bar dataKey="sgpa" radius={[4, 4, 0, 0]} maxBarSize={56}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.sem}
                      fill={
                        entry.sgpa >= 9
                          ? "oklch(0.55 0.16 145)"
                          : entry.sgpa >= 8
                            ? "oklch(0.48 0.18 258)"
                            : entry.sgpa >= 7
                              ? "oklch(0.55 0.16 258)"
                              : entry.sgpa >= 6
                                ? "oklch(0.72 0.16 75)"
                                : "oklch(0.58 0.20 27)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Gold dashed line at SGPA 8.0 — reference benchmark
            </p>
          </div>
        )}

        {/* ─── Semester Results ─────────────────────────────────── */}
        {sorted.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl"
            data-ocid="result.empty_state"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-foreground">
              No results available yet
            </p>
            <p className="text-sm mt-1">
              Semester results will appear here once published.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">
                Semester-wise Results
              </h3>
            </div>
            {sorted.map((semResult) => (
              <SemesterSection
                key={String(semResult.semester)}
                semResult={semResult}
              />
            ))}
          </div>
        )}

        {/* Grade legend */}
        <div className="mt-6 p-4 bg-card border border-border rounded-lg text-xs">
          <p className="font-semibold text-foreground mb-2">
            Grade Scale (VTU)
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { grade: "S", range: "≥90", points: "10" },
              { grade: "A", range: "≥80", points: "9" },
              { grade: "B", range: "≥70", points: "8" },
              { grade: "C", range: "≥60", points: "7" },
              { grade: "D", range: "≥55", points: "6" },
              { grade: "E", range: "≥50", points: "5" },
              { grade: "F", range: "<50", points: "0" },
            ].map(({ grade, range, points }) => (
              <span
                key={grade}
                className={`px-2 py-0.5 rounded text-xs font-medium ${getGradeClass(grade)}`}
              >
                {grade} ({range}) = {points} GP
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* ─── Bottom Actions (no-print) ───────────────────────────── */}
      <div className="border-t border-border bg-card py-4 no-print">
        <div className="container mx-auto px-4 max-w-5xl flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-muted-foreground">
            Results are provisional. For official use, contact your institution.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              data-ocid="result.logout.button"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="bg-primary text-primary-foreground"
              data-ocid="result.download.button"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="vtu-header-gradient text-white/60 text-center text-xs py-3">
        © {new Date().getFullYear()} VTU Result Portal · Built with{" "}
        <span className="text-gold">♥</span> using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline text-white/70 hover:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
