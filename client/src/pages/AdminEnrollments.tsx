import { useState } from "react";
import {
  UserPlus,
  Users,
  GraduationCap,
  Trash2,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminEnrollments() {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const studentsQuery = trpc.admin.students.useQuery();
  const classesQuery = trpc.admin.listClasses.useQuery();

  const enrollMutation = trpc.admin.enrollStudent.useMutation({
    onSuccess: () => {
      setSelectedStudent("");
      setSelectedClass("");
      classesQuery.refetch();
      studentsQuery.refetch();
    },
  });

  const classId = Number(selectedClass);

  const enrolledQuery = trpc.admin.classStudents.useQuery(
    { classId },
    {
      enabled: Boolean(selectedClass),
    },
  );

  const removeMutation = trpc.admin.removeStudent.useMutation({
    onSuccess: () => {
      enrolledQuery.refetch();
    },
  });

  const handleEnroll = () => {
    if (!selectedStudent || !selectedClass) return;

    enrollMutation.mutate({
      studentId: Number(selectedStudent),
      classId: Number(selectedClass),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Student Enrollment</h1>
        <p className="text-muted-foreground">
          Assign students to their classes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrollment form */}
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h2 className="font-semibold">Enroll Student</h2>
              <p className="text-sm text-muted-foreground">
                Add a student to a class.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Student
              </label>

              <select
                value={selectedStudent}
                onChange={(event) =>
                  setSelectedStudent(event.target.value)
                }
                className="w-full rounded-lg border bg-background px-3 py-2"
              >
                <option value="">Select a student</option>

                {studentsQuery.data?.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} — {student.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Class
              </label>

              <select
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(event.target.value)
                }
                className="w-full rounded-lg border bg-background px-3 py-2"
              >
                <option value="">Select a class</option>

                {classesQuery.data?.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name} — {classItem.subjectCode}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleEnroll}
              disabled={
                !selectedStudent ||
                !selectedClass ||
                enrollMutation.isPending
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enrollMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Enroll Student
                </>
              )}
            </button>

            {enrollMutation.isSuccess && (
              <p className="text-sm text-green-600">
                Student enrolled successfully.
              </p>
            )}

            {enrollMutation.error && (
              <p className="text-sm text-destructive">
                {enrollMutation.error.message}
              </p>
            )}
          </div>
        </div>

        {/* Current students */}
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h2 className="font-semibold">Class Students</h2>
              <p className="text-sm text-muted-foreground">
                View students enrolled in a class.
              </p>
            </div>
          </div>

          {!selectedClass ? (
            <div className="flex min-h-40 flex-col items-center justify-center text-center text-muted-foreground">
              <GraduationCap className="mb-2 h-8 w-8" />
              <p>Select a class to see enrolled students.</p>
            </div>
          ) : enrolledQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : enrolledQuery.data?.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No students enrolled yet.
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledQuery.data?.map((student) => (
                <div
                  key={student.enrollmentId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeMutation.mutate({
                        enrollmentId: student.enrollmentId,
                      })
                    }
                    disabled={removeMutation.isPending}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                    title="Remove student"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
