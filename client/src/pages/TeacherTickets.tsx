import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  Loader2,
  Paperclip,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function TeacherTickets() {
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
              Student Tickets
            </h1>
            <p className="text-sm text-slate-500">
              View and answer questions from your students
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <TeacherTicketsSection />
      </main>
    </div>
  );
}

function TeacherTicketsSection() {
  const utils = trpc.useUtils();

  const [selectedTicketStudentId, setSelectedTicketStudentId] = useState<number | null>(null);
  const [answerFiles, setAnswerFiles] = useState<Record<number, File | null>>({});
  const answerFileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const { user } = useAuth();

  const handleAnswerFileChange = (questionId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAnswerFiles((current) => ({
      ...current,
      [questionId]: file,
    }));
  };

  const sendTeacherAnswer = async (questionId: number, response: string) => {
    const trimmedResponse = response.trim();
    const file = answerFiles[questionId];

    if (!trimmedResponse && !file) {
      alert("Please write an answer or attach a file.");
      return;
    }

    let teacherFileName: string | undefined;
    let teacherFileUrl: string | undefined;
    let teacherStorageKey: string | undefined;
    let teacherMimeType: string | undefined;
    let teacherFileSize: number | undefined;

    if (file) {
      const bytes = new Uint8Array(await file.arrayBuffer());

      let binary = "";
      const chunkSize = 0x8000;

      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(
          ...Array.from(bytes.subarray(i, i + chunkSize)),
        );
      }

      const fileData = btoa(binary);

      const result = await answerQuestionMutation.mutateAsync({
        questionId,
        teacherResponse: trimmedResponse,
        teacherFileName: file.name,
        teacherFileUrl: undefined,
        teacherStorageKey: undefined,
        teacherMimeType: file.type || "application/octet-stream",
        teacherFileSize: file.size,
        fileData,
      } as any);

      void result;

      setAnswerFiles((current) => ({
        ...current,
        [questionId]: null,
      }));

      const input = answerFileInputRefs.current[questionId];
      if (input) input.value = "";

      return;
    }

    await answerQuestionMutation.mutateAsync({
      questionId,
      teacherResponse: trimmedResponse,
      fileName: undefined,
      mimeType: undefined,
      fileSize: undefined,
      fileData: undefined,
    });
  };

  const teacherClassesQuery = trpc.portal.teacherClasses.useQuery(undefined, {
    enabled: !!user && user.role === "teacher",
  });

  const teacherStudentsQuery = trpc.portal.teacherStudents.useQuery(undefined, {
    enabled: !!user && user.role === "teacher",
  });

  const teacherQuestionsQuery = trpc.portal.teacherQuestions.useQuery(undefined, {
    enabled: !!user && user.role === "teacher",
  });

  const answerQuestionMutation = trpc.portal.answerQuestion.useMutation({
    onSuccess: async () => {
      await utils.portal.teacherQuestions.invalidate();
      alert("Answer sent to student.");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const teacherClasses = teacherClassesQuery.data ?? [];
  const teacherStudents = teacherStudentsQuery.data ?? [];

  const uniqueTeacherStudents = Array.from(
    new Map(teacherStudents.map((student) => [student.id, student])).values(),
  );

  const openQuestions = (teacherQuestionsQuery.data ?? []).filter(
    (question) => question.status !== "answered",
  );

  const selectedStudent = uniqueTeacherStudents.find(
    (student) => student.id === selectedTicketStudentId,
  ) ?? null;

  const selectedStudentQuestions = (teacherQuestionsQuery.data ?? []).filter(
    (question) => question.studentId === selectedTicketStudentId,
  );

  useEffect(() => {
    if (selectedTicketStudentId === null && uniqueTeacherStudents.length > 0) {
      const firstWithOpenQuestion = uniqueTeacherStudents.find((student) =>
        openQuestions.some((question) => question.studentId === student.id),
      );

      setSelectedTicketStudentId(
        firstWithOpenQuestion?.id ?? uniqueTeacherStudents[0].id,
      );
    }
  }, [selectedTicketStudentId, uniqueTeacherStudents.length, openQuestions.length]);

  return (

          <section id="student-tickets" className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Student Tickets</h3>
                <p className="mt-1 text-sm text-slate-500">Students assigned to your classes are grouped here. A red glowing dot means they have an open query.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                {uniqueTeacherStudents.length} students · {openQuestions.length} open
              </span>
            </div>

            {teacherStudentsQuery.isLoading || teacherQuestionsQuery.isLoading ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">Loading students and tickets...</div>
            ) : uniqueTeacherStudents.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
                <Users className="mx-auto text-slate-300" size={34} />
                <p className="mt-3 font-medium text-slate-900">No students assigned yet</p>
                <p className="mt-1 text-sm text-slate-500">An administrator can enroll students into your classes.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-[290px_1fr]">
                <div className="rounded-xl border bg-slate-50 p-3">
                  <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Students</p>
                  <div className="max-h-[560px] space-y-1 overflow-y-auto">
                    {teacherClasses.map((classItem) => {
                      const classStudents = uniqueTeacherStudents.filter((student) => student.classId === classItem.id);
                      if (!classStudents.length) return null;
                      return (
                        <div key={classItem.id} className="mb-3">
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">{classItem.subjectCode} · {classItem.name}</div>
                          {classStudents.map((student) => {
                            const hasOpen = openQuestions.some((question) => question.studentId === student.id);
                            const questionCount = (teacherQuestionsQuery.data ?? []).filter((question) => question.studentId === student.id).length;
                            return (
                              <button key={`${classItem.id}-${student.id}`} type="button" onClick={() => setSelectedTicketStudentId(student.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${selectedTicketStudentId === student.id ? "bg-white shadow-sm ring-1 ring-blue-100" : "hover:bg-white"}`}>
                                <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                  {(student.name || "S").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                                  {hasOpen && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_9px_rgba(239,68,68,.95)]" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-slate-900">{student.name || "Student"}</span>
                                  <span className="block truncate text-[11px] text-slate-500">{student.email || "No email"}</span>
                                </span>
                                {questionCount > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{questionCount}</span>}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border bg-white p-5">
                  {selectedStudent ? (
                    <>
                      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Selected student</p>
                          <h4 className="mt-1 text-xl font-semibold text-slate-900">{selectedStudent.name || "Student"}</h4>
                          <p className="mt-1 text-xs text-slate-500">{selectedStudent.email || "No email"}</p>
                        </div>
                        {selectedStudentQuestions.some((question) => question.status !== "answered") ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"><span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,.95)]" />Query needs attention</span>
                        ) : (
                          <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">All tickets answered</span>
                        )}
                      </div>

                      {selectedStudentQuestions.length === 0 ? (
                        <div className="py-12 text-center text-sm text-slate-500">No tickets from this student.</div>
                      ) : (
                        <div className="mt-5 space-y-5">
                          {selectedStudentQuestions.map((question) => (
                            <div key={question.id} className="rounded-xl border bg-slate-50 p-5">
                              <div className="flex items-center justify-between gap-3">
                                <div><span className="text-xs font-bold text-blue-600">{question.subjectCode}</span><span className="ml-2 text-xs text-slate-500">{question.className}</span></div>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${question.status === "answered" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{question.status === "answered" ? "Answered" : "Open"}</span>
                              </div>
                              <div className="mt-4 rounded-xl border bg-white p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{question.message}</p>{question.studentFileName && <button type="button" onClick={() => window.open(`/api/questions/${question.id}/student-file/view`, "_blank", "noopener,noreferrer")} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline"><Paperclip size={14} />{question.studentFileName}</button>}</div>
                              {question.status === "answered" ? (
                                <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-green-700">Your response</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-green-900">{question.teacherResponse}</p>{question.teacherFileName && <a href={`/api/questions/${question.id}/teacher-file/view`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-green-700 hover:underline"><Paperclip size={14} />{question.teacherFileName}</a>}</div>
                              ) : (
                                <div className="mt-4 rounded-xl border bg-white p-4"><label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Solve ticket</label><textarea id={`answer-${question.id}`} rows={4} placeholder="Write your response to the student..." className="mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" /><input ref={(element) => { answerFileInputRefs.current[question.id] = element; }} type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip" className="hidden" onChange={(event) => handleAnswerFileChange(question.id, event)} />{answerFiles[question.id] && <div className="mt-3 flex items-center justify-between rounded-xl border bg-slate-50 p-3"><span className="truncate text-xs font-semibold text-slate-700">{answerFiles[question.id]?.name}</span><button type="button" onClick={() => { setAnswerFiles((current) => ({ ...current, [question.id]: null })); const input = answerFileInputRefs.current[question.id]; if (input) input.value = ""; }} className="text-xs font-semibold text-red-600">Remove</button></div>}<div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => answerFileInputRefs.current[question.id]?.click()} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Paperclip size={14} />Attach file</button><button type="button" disabled={answerQuestionMutation.isPending} onClick={() => { const textarea = document.getElementById(`answer-${question.id}`) as HTMLTextAreaElement | null; void sendTeacherAnswer(question.id, textarea?.value ?? ""); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{answerQuestionMutation.isPending ? <><Loader2 size={14} className="animate-spin" />Sending...</> : "Send Answer"}</button></div></div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : <div className="py-12 text-center text-sm text-slate-500">Select a student to view their tickets.</div>}
                </div>
              </div>
            )}
          </section>


  );
}
