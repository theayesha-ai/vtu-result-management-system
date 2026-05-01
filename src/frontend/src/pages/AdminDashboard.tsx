import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
/**
 * AdminDashboard — protected admin panel for managing students and marks.
 * Two tabs: Students (CRUD) and Marks (subject results per student).
 */
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import {
  useAddOrUpdateResult,
  useAddStudent,
  useAllStudents,
  useDeleteResult,
  useDeleteStudent,
  useStudentResultsAdmin,
  useUpdateStudent,
} from "../hooks/useQueries";
import type { SemesterResult, SemesterResults, Student } from "../types";

// ─── Types ────────────────────────────────────────────────────────
interface StudentFormData {
  name: string;
  usn: string;
  dob: string;
  currentSemester: string;
}

interface MarksFormData {
  semester: string;
  subjectCode: string;
  subjectName: string;
  internalMarks: string;
  externalMarks: string;
  credits: string;
  announcedOn: string;
}

const EMPTY_STUDENT_FORM: StudentFormData = {
  name: "",
  usn: "",
  dob: "",
  currentSemester: "1",
};

const EMPTY_MARKS_FORM: MarksFormData = {
  semester: "1",
  subjectCode: "",
  subjectName: "",
  internalMarks: "",
  externalMarks: "",
  credits: "4",
  announcedOn: new Date().toISOString().split("T")[0],
};

// ─── Student Form Dialog ──────────────────────────────────────────
function StudentFormDialog({
  open,
  onOpenChange,
  editingStudent,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingStudent: Student | null;
  onSubmit: (data: StudentFormData) => void;
  isPending: boolean;
}) {
  const isEdit = !!editingStudent;
  const [form, setForm] = useState<StudentFormData>(() =>
    editingStudent
      ? {
          name: editingStudent.name,
          usn: editingStudent.usn,
          dob: editingStudent.dob,
          currentSemester: String(Number(editingStudent.currentSemester)),
        }
      : EMPTY_STUDENT_FORM,
  );
  const [errors, setErrors] = useState<Partial<StudentFormData>>({});

  // Reset form when dialog opens
  function handleOpen(v: boolean) {
    if (v) {
      setForm(
        editingStudent
          ? {
              name: editingStudent.name,
              usn: editingStudent.usn,
              dob: editingStudent.dob,
              currentSemester: String(Number(editingStudent.currentSemester)),
            }
          : EMPTY_STUDENT_FORM,
      );
      setErrors({});
    }
    onOpenChange(v);
  }

  function validate(): boolean {
    const errs: Partial<StudentFormData> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.usn.trim()) errs.usn = "USN is required";
    if (!form.dob.trim()) errs.dob = "Date of birth is required";
    const sem = Number.parseInt(form.currentSemester);
    if (Number.isNaN(sem) || sem < 1 || sem > 8)
      errs.currentSemester = "Semester must be 1–8";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md" data-ocid="admin.student.modal">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit Student" : "Add New Student"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the student's record below."
              : "Enter student details to add them to the system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="sName">Full Name *</Label>
            <Input
              id="sName"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Student full name"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sUsn">USN *</Label>
            <Input
              id="sUsn"
              value={form.usn}
              onChange={(e) =>
                setForm((p) => ({ ...p, usn: e.target.value.toUpperCase() }))
              }
              placeholder="e.g. 1AB22CS001"
              disabled={isEdit}
              className="font-mono uppercase"
            />
            {errors.usn && (
              <p className="text-xs text-destructive">{errors.usn}</p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                USN cannot be changed after creation.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sDob">Date of Birth *</Label>
            <Input
              id="sDob"
              type="date"
              value={form.dob}
              onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
            />
            {errors.dob && (
              <p className="text-xs text-destructive">{errors.dob}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sSem">Current Semester *</Label>
            <Select
              value={form.currentSemester}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, currentSemester: v }))
              }
            >
              <SelectTrigger id="sSem">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    Semester {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currentSemester && (
              <p className="text-xs text-destructive">
                {errors.currentSemester}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="admin.confirm_delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground"
              data-ocid="admin.add_student.button"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update Student"
              ) : (
                "Add Student"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Students Tab ─────────────────────────────────────────────────
function StudentsTab() {
  const { data: students, isLoading } = useAllStudents();
  const addStudent = useAddStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  function openAddDialog() {
    setEditingStudent(null);
    setDialogOpen(true);
  }

  function openEditDialog(student: Student) {
    setEditingStudent(student);
    setDialogOpen(true);
  }

  async function handleFormSubmit(data: StudentFormData) {
    const student: Student = {
      name: data.name.trim(),
      usn: data.usn.trim().toUpperCase(),
      dob: data.dob,
      currentSemester: BigInt(Number.parseInt(data.currentSemester)),
    };

    try {
      if (editingStudent) {
        await updateStudent.mutateAsync(student);
        toast.success(`Updated ${student.name}'s record`);
      } else {
        await addStudent.mutateAsync(student);
        toast.success(`Added student ${student.name}`);
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Operation failed";
      toast.error(msg);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteStudent.mutateAsync(deleteTarget.usn);
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  }

  const isPending = addStudent.isPending || updateStudent.isPending;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-lg text-foreground">
            Students
          </h2>
          <p className="text-sm text-muted-foreground">
            {students?.length ?? 0} student
            {(students?.length ?? 0) !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-primary text-primary-foreground gap-1.5"
          data-ocid="admin.add_student.button"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wide">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">
                USN
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide hidden md:table-cell">
                DOB
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-center">
                Semester
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ["sk1", "sk2", "sk3", "sk4"].map((key) => (
                <TableRow key={key}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !students || students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="admin.students.empty_state"
                >
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No students added yet</p>
                  <p className="text-xs mt-1">
                    Click "Add Student" to get started
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, idx) => (
                <TableRow
                  key={student.usn}
                  className={idx % 2 === 0 ? "table-row-even" : "table-row-odd"}
                  data-ocid={`admin.students.item.${idx + 1}`}
                >
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="font-mono text-sm text-primary">
                    {student.usn}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {student.dob}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      Sem {Number(student.currentSemester)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(student)}
                        className="h-8 px-2.5 text-xs"
                        data-ocid={`admin.student.edit_button.${idx + 1}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(student)}
                        className="h-8 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        data-ocid={`admin.student.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Student form dialog */}
      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingStudent={editingStudent}
        onSubmit={handleFormSubmit}
        isPending={isPending}
      />

      {/* Delete confirm dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="admin.confirm_delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>{" "}
              ({deleteTarget?.usn}) and all their results. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.confirm_delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteStudent.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="admin.confirm_delete.confirm_button"
            >
              {deleteStudent.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Marks Tab ────────────────────────────────────────────────────
function MarksTab() {
  const { data: students } = useAllStudents();
  const [selectedUsn, setSelectedUsn] = useState<string | null>(null);
  const { data: studentResults, isLoading: resultsLoading } =
    useStudentResultsAdmin(selectedUsn);
  const addOrUpdateResult = useAddOrUpdateResult();
  const deleteResult = useDeleteResult();

  const [form, setForm] = useState<MarksFormData>(EMPTY_MARKS_FORM);
  const [formErrors, setFormErrors] = useState<Partial<MarksFormData>>({});
  const [deleteTarget, setDeleteTarget] = useState<{
    semester: bigint;
    subjectCode: string;
    subjectName: string;
  } | null>(null);

  function validateMarksForm(): boolean {
    const errs: Partial<MarksFormData> = {};
    if (!form.subjectCode.trim()) errs.subjectCode = "Required";
    if (!form.subjectName.trim()) errs.subjectName = "Required";
    const internal = Number.parseInt(form.internalMarks);
    const external = Number.parseInt(form.externalMarks);
    const credits = Number.parseInt(form.credits);
    if (Number.isNaN(internal) || internal < 0 || internal > 50)
      errs.internalMarks = "Must be 0–50";
    if (Number.isNaN(external) || external < 0 || external > 100)
      errs.externalMarks = "Must be 0–100";
    if (Number.isNaN(credits) || credits < 0 || credits > 10)
      errs.credits = "Must be 0–10";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAddMarks(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUsn || !validateMarksForm()) return;

    try {
      await addOrUpdateResult.mutateAsync({
        usn: selectedUsn,
        semester: Number.parseInt(form.semester),
        subjectCode: form.subjectCode.trim().toUpperCase(),
        subjectName: form.subjectName.trim(),
        internalMarks: Number.parseInt(form.internalMarks),
        externalMarks: Number.parseInt(form.externalMarks),
        credits: Number.parseInt(form.credits),
        announcedOn: form.announcedOn || new Date().toISOString().split("T")[0],
      });
      toast.success("Subject marks saved successfully");
      setForm(EMPTY_MARKS_FORM);
      setFormErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save marks";
      toast.error(msg);
    }
  }

  async function handleDeleteResult() {
    if (!deleteTarget || !selectedUsn) return;
    try {
      await deleteResult.mutateAsync({
        usn: selectedUsn,
        semester: deleteTarget.semester,
        subjectCode: deleteTarget.subjectCode,
      });
      toast.success(`Deleted ${deleteTarget.subjectName}`);
      setDeleteTarget(null);
    } catch (_err: unknown) {
      toast.error("Failed to delete subject");
    }
  }

  const sortedSemesters = studentResults?.allSemesterResults
    ? [...studentResults.allSemesterResults].sort(
        (a, b) => Number(a.semester) - Number(b.semester),
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Student selector */}
      <div>
        <h2 className="font-display font-semibold text-lg text-foreground mb-1">
          Manage Marks
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Select a student to view and manage their subject marks
        </p>
        <div className="max-w-sm">
          <Label className="mb-1.5 block">Select Student</Label>
          <Select
            value={selectedUsn ?? ""}
            onValueChange={(v) => setSelectedUsn(v)}
          >
            <SelectTrigger data-ocid="admin.marks.select">
              <SelectValue placeholder="Choose a student..." />
            </SelectTrigger>
            <SelectContent>
              {students?.map((s) => (
                <SelectItem key={s.usn} value={s.usn}>
                  {s.name} — {s.usn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedUsn && (
        <>
          <Separator />

          {/* Add subject form */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Add / Update Subject Marks
            </h3>
            <form onSubmit={handleAddMarks}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {/* Semester */}
                <div className="space-y-1 col-span-1">
                  <Label className="text-xs">Semester</Label>
                  <Select
                    value={form.semester}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, semester: v }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject Code */}
                <div className="space-y-1 col-span-1">
                  <Label className="text-xs">Subject Code</Label>
                  <Input
                    value={form.subjectCode}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        subjectCode: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g. 22CS001"
                    className={`h-9 font-mono text-xs uppercase ${formErrors.subjectCode ? "border-destructive" : ""}`}
                  />
                  {formErrors.subjectCode && (
                    <p className="text-xs text-destructive">
                      {formErrors.subjectCode}
                    </p>
                  )}
                </div>

                {/* Subject Name */}
                <div className="space-y-1 col-span-2 md:col-span-3 lg:col-span-1">
                  <Label className="text-xs">Subject Name</Label>
                  <Input
                    value={form.subjectName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, subjectName: e.target.value }))
                    }
                    placeholder="e.g. Data Structures"
                    className={`h-9 text-sm ${formErrors.subjectName ? "border-destructive" : ""}`}
                  />
                  {formErrors.subjectName && (
                    <p className="text-xs text-destructive">
                      {formErrors.subjectName}
                    </p>
                  )}
                </div>

                {/* Internal */}
                <div className="space-y-1">
                  <Label className="text-xs">Internal (0-50)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={form.internalMarks}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, internalMarks: e.target.value }))
                    }
                    placeholder="0"
                    className={`h-9 text-sm ${formErrors.internalMarks ? "border-destructive" : ""}`}
                  />
                  {formErrors.internalMarks && (
                    <p className="text-xs text-destructive">
                      {formErrors.internalMarks}
                    </p>
                  )}
                </div>

                {/* External */}
                <div className="space-y-1">
                  <Label className="text-xs">External (0-100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.externalMarks}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, externalMarks: e.target.value }))
                    }
                    placeholder="0"
                    className={`h-9 text-sm ${formErrors.externalMarks ? "border-destructive" : ""}`}
                  />
                  {formErrors.externalMarks && (
                    <p className="text-xs text-destructive">
                      {formErrors.externalMarks}
                    </p>
                  )}
                </div>

                {/* Credits */}
                <div className="space-y-1">
                  <Label className="text-xs">Credits</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={form.credits}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, credits: e.target.value }))
                    }
                    placeholder="4"
                    className={`h-9 text-sm ${formErrors.credits ? "border-destructive" : ""}`}
                  />
                  {formErrors.credits && (
                    <p className="text-xs text-destructive">
                      {formErrors.credits}
                    </p>
                  )}
                </div>

                {/* Announced On */}
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <Label className="text-xs">Announced On</Label>
                  <Input
                    type="date"
                    value={form.announcedOn}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, announcedOn: e.target.value }))
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={addOrUpdateResult.isPending}
                className="bg-primary text-primary-foreground"
                data-ocid="admin.add_marks.submit_button"
              >
                {addOrUpdateResult.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Save Marks
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Existing results */}
          {resultsLoading ? (
            <div data-ocid="result.loading_state" className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : sortedSemesters.length === 0 ? (
            <div
              className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-lg"
              data-ocid="admin.marks.empty_state"
            >
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No marks entered yet</p>
              <p className="text-xs mt-1">
                Use the form above to add subject marks
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedSemesters.map((semResult: SemesterResults) => (
                <div
                  key={String(semResult.semester)}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <div className="bg-muted/50 px-4 py-2.5 flex items-center justify-between border-b border-border">
                    <h4 className="font-semibold text-sm text-foreground">
                      Semester {Number(semResult.semester)}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      SGPA: {semResult.sgpa.toFixed(2)}
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs w-28">Code</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs text-center w-20">
                          Int
                        </TableHead>
                        <TableHead className="text-xs text-center w-20">
                          Ext
                        </TableHead>
                        <TableHead className="text-xs text-center w-16">
                          Total
                        </TableHead>
                        <TableHead className="text-xs text-center w-14">
                          Grade
                        </TableHead>
                        <TableHead className="text-xs text-center w-12">
                          Cr
                        </TableHead>
                        <TableHead className="text-xs w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {semResult.results.map((r: SemesterResult, i: number) => (
                        <TableRow
                          key={r.subjectCode}
                          className={
                            i % 2 === 0 ? "table-row-even" : "table-row-odd"
                          }
                        >
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {r.subjectCode}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.subjectName}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {Number(r.internalMarks)}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {Number(r.externalMarks)}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-sm">
                            {Number(r.totalMarks)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-sm">{r.grade}</span>
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {Number(r.credits)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setDeleteTarget({
                                  semester: semResult.semester,
                                  subjectCode: r.subjectCode,
                                  subjectName: r.subjectName,
                                })
                              }
                              className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete subject confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="admin.confirm_delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteTarget?.subjectName}</strong> (
              {deleteTarget?.subjectCode}) from Semester{" "}
              {deleteTarget ? Number(deleteTarget.semester) : ""}? This will
              recalculate SGPA and CGPA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.confirm_delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteResult}
              disabled={deleteResult.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="admin.confirm_delete.confirm_button"
            >
              {deleteResult.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main AdminDashboard ──────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdminLoggedIn, setIsAdminLoggedIn } = useAppContext();
  const { clear } = useInternetIdentity();

  function handleLogout() {
    clear();
    setIsAdminLoggedIn(false);
    navigate({ to: "/" });
  }

  // Guard: redirect if not admin
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <div className="text-5xl">🔒</div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Access Denied
          </h2>
          <p className="text-muted-foreground text-sm">
            You must be logged in as an administrator to access this page.
          </p>
          <Button
            onClick={() => navigate({ to: "/" })}
            className="bg-primary text-primary-foreground"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Admin Header ────────────────────────────────────────── */}
      <header className="vtu-header-gradient text-white">
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
                <h1 className="font-display font-bold text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                  Admin Dashboard
                </h1>
                <p className="text-xs text-white/60">
                  VTU Result Management System
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="students">
          <TabsList className="mb-6 grid w-full max-w-sm grid-cols-2">
            <TabsTrigger
              value="students"
              className="gap-1.5"
              data-ocid="admin.students.tab"
            >
              <GraduationCap className="w-4 h-4" />
              Students
            </TabsTrigger>
            <TabsTrigger
              value="marks"
              className="gap-1.5"
              data-ocid="admin.marks.tab"
            >
              <BookOpen className="w-4 h-4" />
              Marks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="animate-fade-in">
            <StudentsTab />
          </TabsContent>

          <TabsContent value="marks" className="animate-fade-in">
            <MarksTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="vtu-header-gradient text-white/60 text-center text-xs py-3 mt-8">
        © {new Date().getFullYear()} VTU Admin Portal · Built with{" "}
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
