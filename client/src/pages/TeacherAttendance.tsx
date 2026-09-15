import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  XCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

function TeacherAttendanceSection() {
  const utils = trpc.useUtils();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [topic, setTopic] = useState("");
  const [minimumPercentage, setMinimumPercentage] = useState("75");
  const [statuses, setStatuses] = useState<
    Record<number, "present" | "absent" | "late">
  >({});

  const classesQuery = trpc.portal.teacherAttendanceClasses.useQuery();

  const attendanceQuery = trpc.portal.teacherAttendance.useQuery(
    { classId: selectedClassId ?? 0 },
    {
      enabled: selectedClassId !== null,
    },
  );

  const settingsQuery = trpc.portal.attendanceSettings.useQuery(
    { classId: selectedClassId ?? 0 },
    {
      enabled: selectedClassId !== null,
    },
  );

  const createAttendanceMutation =
    trpc.portal.createAttendance.useMutation({
      onSuccess: async () => {
        await utils.portal.teacherAttendance.invalidate();
        toast.success("Attendance saved successfully.");
        setTopic("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const minimumMutation =
    trpc.portal.setAttendanceMinimum.useMutation({
      onSuccess: async () => {
        if (selectedClassId !== null) {
          await utils.portal.attendanceSettings.invalidate({
            classId: selectedClassId,
          });
          await utils.portal.teacherAttendance.invalidate({
            classId: selectedClassId,
          });
        }
        toast.success("Minimum attendance updated.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  useEffect(() => {
    const firstClass = classesQuery.data?.[0];
    if (selectedClassId === null && firstClass) {
      setSelectedClassId(firstClass.id);
    }
  }, [classesQuery.data, selectedClassId]);

  useEffect(() => {
    if (settingsQuery.data) {
      setMinimumPercentage(
        String(settingsQuery.data.minimumPercentage),
      );
    }
  }, [settingsQuery.data]);

  useEffect(() => {
    const students = attendanceQuery.data?.students ?? [];
    const next: Record<
      number,
      "present" | "absent" | "late"
    > = {};

    for (const student of students) {
      next[student.id] = "present";
    }

    setStatuses(next);
  }, [selectedClassId, attendanceQuery.data?.students]);

  const students = attendanceQuery.data?.students ?? [];
  const sessions = attendanceQuery.data?.sessions ?? [];
  const records = attendanceQuery.data?.records ?? [];

  const selectedClass = (classesQuery.data ?? []).find(
    (item) => item.id === selectedClassId,
  );

  const setStatus = (
    studentId: number,
    status: "present" | "absent" | "late",
  ) => {
    setStatuses((current) => ({
      ...current,
      [studentId]: status,
    }));
  };

  const markAll = (
    status: "present" | "absent" | "late",
  ) => {
    const next: Record<
      number,
      "present" | "absent" | "late"
    > = {};

    for (const student of students) {
      next[student.id] = status;
    }

    setStatuses(next);
  };

  const saveAttendance = () => {
    if (!selectedClassId) {
      toast.error("Select a class first.");
      return;
    }

    if (!sessionDate) {
      toast.error("Select a date.");
      return;
    }

    if (students.length === 0) {
      toast.error("This class has no enrolled students.");
      return;
    }

    createAttendanceMutation.mutate({
      classId: selectedClassId,
      sessionDate: new Date(`${sessionDate}T09:00:00`),
      topic: topic.trim() || undefined,
      records: students.map((student) => ({
        studentId: student.id,
        status: statuses[student.id] ?? "present",
      })),
    });
  };

  const saveMinimum = () => {
    if (!selectedClassId) return;

    const value = Number(minimumPercentage);

    if (!Number.isInteger(value) || value < 1 || value > 100) {
      toast.error("Minimum attendance must be between 1 and 100.");
      return;
    }

    minimumMutation.mutate({
      classId: selectedClassId,
      minimumPercentage: value,
    });
  };

  const countStatus = (status: "present" | "absent" | "late") =>
    students.filter((student) => statuses[student.id] === status).length;

  return (
    <section className="mb-10 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarCheck size={22} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              Attendance
            </h3>
            <p className="text-sm text-slate-500">
              Record attendance and monitor the class attendance threshold.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2">
          <span className="text-xs font-medium text-slate-500">
            Minimum
          </span>
          <input
            value={minimumPercentage}
            onChange={(event) => setMinimumPercentage(event.target.value)}
            type="number"
            min={1}
            max={100}
            className="w-16 rounded-lg border bg-white px-2 py-1.5 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-semibold text-slate-700">%</span>
          <button
            type="button"
            onClick={saveMinimum}
            disabled={minimumMutation.isPending}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {classesQuery.isLoading ? (
        <div className="mt-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
          Loading attendance classes...
        </div>
      ) : (classesQuery.data ?? []).length === 0 ? (
        <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
          <Users className="mx-auto text-slate-300" size={34} />
          <p className="mt-3 font-medium text-slate-900">
            No classes available
          </p>
          <p className="mt-1 text-sm text-slate-500">
            An administrator needs to assign a class to you first.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Class
            </label>
            <select
              value={selectedClassId ?? ""}
              onChange={(event) =>
                setSelectedClassId(
                  event.target.value
                    ? Number(event.target.value)
                    : null,
                )
              }
              className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(classesQuery.data ?? []).map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.subjectCode} — {classItem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[180px_1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(event) => setSessionDate(event.target.value)}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Topic
              </label>
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. Unit 3 — Linked Lists"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {attendanceQuery.isLoading ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
              Loading students...
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => markAll("present")}
                  className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
                >
                  Mark all present
                </button>
                <button
                  type="button"
                  onClick={() => markAll("late")}
                  className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                >
                  Mark all late
                </button>
                <button
                  type="button"
                  onClick={() => markAll("absent")}
                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Mark all absent
                </button>

                <span className="ml-auto text-xs text-slate-500">
                  {students.length} students
                </span>
              </div>

              {students.length === 0 ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No students are enrolled in this class.
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border">
                  <div className="hidden grid-cols-[1fr_110px_110px_110px] gap-2 border-b bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid">
                    <span>Student</span>
                    <span>Present</span>
                    <span>Late</span>
                    <span>Absent</span>
                  </div>

                  {students.map((student) => {
                    const status = statuses[student.id] ?? "present";

                    return (
                      <div
                        key={student.id}
                        className="grid gap-3 border-b px-4 py-4 last:border-b-0 md:grid-cols-[1fr_110px_110px_110px] md:items-center"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {student.name || "Student"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {student.email || "No email"}
                          </p>
                        </div>

                        {(
                          [
                            ["present", "Present", "green"],
                            ["late", "Late", "amber"],
                            ["absent", "Absent", "red"],
                          ] as const
                        ).map(([value, label, tone]) => {
                          const active = status === value;

                          const toneClasses =
                            tone === "green"
                              ? active
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-slate-200 text-slate-500"
                              : tone === "amber"
                                ? active
                                  ? "border-amber-500 bg-amber-50 text-amber-700"
                                  : "border-slate-200 text-slate-500"
                                : active
                                  ? "border-red-500 bg-red-50 text-red-700"
                                  : "border-slate-200 text-slate-500";

                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setStatus(student.id, value)}
                              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${toneClasses}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-green-700">
                  <CheckCircle2 size={14} />
                  Present {countStatus("present")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
                  <Clock3 size={14} />
                  Late {countStatus("late")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-red-700">
                  <XCircle size={14} />
                  Absent {countStatus("absent")}
                </span>
              </div>

              <button
                type="button"
                onClick={saveAttendance}
                disabled={
                  createAttendanceMutation.isPending ||
                  students.length === 0
                }
                className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarCheck size={17} />
                {createAttendanceMutation.isPending
                  ? "Saving attendance..."
                  : "Save Attendance"}
              </button>
            </>
          )}

          <div className="mt-8 border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900">
                  Attendance History
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  Previous sessions recorded for{" "}
                  {selectedClass?.name ?? "this class"}.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {sessions.length} sessions
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No attendance sessions recorded yet.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {sessions.slice(0, 8).map((session) => {
                  const sessionRecords = records.filter(
                    (record) => record.sessionId === session.id,
                  );
                  const present = sessionRecords.filter(
                    (record) =>
                      record.status === "present" ||
                      record.status === "late",
                  ).length;
                  const absent = sessionRecords.filter(
                    (record) => record.status === "absent",
                  ).length;

                  return (
                    <div
                      key={session.id}
                      className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {new Date(session.sessionDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {session.topic || "Class session"}
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                          {present} present
                        </span>
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">
                          {absent} absent
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}


export default function TeacherAttendance() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Loading...
      </div>
    );
  }

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => setLocation("/teacher")}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
            title="Back to Teacher Portal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Attendance Management
            </h1>
            <p className="text-sm text-slate-500">
              Record, review, and manage student attendance
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <TeacherAttendanceSection />
      </main>
    </div>
  );
}
