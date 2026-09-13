import { useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpRight, Bell, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Download, FileText, LayoutDashboard, LogOut, MessageCircle, Paperclip, Plus, Send, Sparkles, Upload, UserRound, Users } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Role = "student" | "teacher";
type Resource = {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  createdAt: string;
  fileUrl?: string;
  classId?: number;
};
type Question = { id: string; message: string; subject: string; createdAt: string; answered: boolean };

const subjects = [
  { name: "Mathematics", short: "MTH", teacher: "Dr. Ava Thompson", accent: "#FF674F", soft: "#FFF0EA", icon: "∑", progress: 72, description: "Patterns, functions, and the beautiful logic underneath." },
  { name: "Biology", short: "BIO", teacher: "Dr. Meera Rao", accent: "#7DAE92", soft: "#EAF2E9", icon: "◒", progress: 48, description: "The living world, from cells to ecosystems." },
  { name: "Physics", short: "PHY", teacher: "Prof. Eli Morgan", accent: "#7798D7", soft: "#EEF2FF", icon: "◉", progress: 61, description: "Motion, energy, and the questions that move us." },
  { name: "Literature", short: "LIT", teacher: "Prof. Nora Chen", accent: "#B28BC9", soft: "#F6EEFB", icon: "Aa", progress: 86, description: "Find yourself in the stories others wrote." },
];

const initialResources: Resource[] = [
  { id: "r1", name: "Practice set 04 · Functions.pdf", size: "1.2 MB", type: "PDF", uploadedBy: "Dr. Ava Thompson", createdAt: "Today" },
  { id: "r2", name: "Cell structures · Lesson note.docx", size: "840 KB", type: "DOCX", uploadedBy: "Dr. Meera Rao", createdAt: "Yesterday" },
];
const readStorage = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } };

function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Mark() { return <div className="flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FF674F] text-white"><span className="font-display text-lg font-bold">B</span></div><div><div className="font-display text-sm font-bold tracking-tight text-[#252827]">BRCM</div><div className="text-[8px] font-bold uppercase tracking-[.16em] text-[#AAA49B]">College portal</div></div></div>; }
function Avatar({ initials, color }: { initials: string; color: string }) { return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: color }}>{initials}</span>; }

function Sidebar({ role, active, setActive, onExit }: { role: Role; active: string; setActive: (v: string) => void; onExit: () => void }) {
  const items = role === "student" ? [["Overview", LayoutDashboard], ["My subjects", BookOpen], ["Ask a teacher", MessageCircle], ["Resources", FileText]] as const : [["Overview", LayoutDashboard], ["My classes", BookOpen], ["Questions", MessageCircle], ["Resource library", Upload]] as const;
  return <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[#EAE4DB] bg-[#F8F5EF] px-5 py-6 lg:flex"><Mark /><div className="mt-12 text-[10px] font-bold uppercase tracking-[.22em] text-[#B1ACA4]">Workspace</div><nav className="mt-4 space-y-1">{items.map(([label, Icon]) => <button key={label} onClick={() => setActive(label)} className={`side-link ${active === label ? "side-link-active" : ""}`}><Icon className="h-4 w-4" />{label}{label === "Questions" && role === "teacher" ? <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#FF674F] px-1.5 text-[10px] font-bold text-white">4</span> : null}</button>)}</nav><div className="mt-auto"><div className="rounded-2xl bg-[#E7F0E8] p-4"><Sparkles className="h-4 w-4 text-[#6D9778]" /><div className="mt-3 text-xs font-bold text-[#3C5B45]">{role === "student" ? "You’re on a roll" : "Your classroom pulse"}</div><p className="mt-1 text-[11px] leading-5 text-[#6B8571]">{role === "student" ? "Keep your learning streak alive." : "Your live resources are ready."}</p></div><button onClick={onExit} className="mt-6 flex items-center gap-2 px-2 text-xs font-semibold text-[#9B968E] transition hover:text-[#FF674F]"><LogOut className="h-3.5 w-3.5" /> Exit preview</button></div></aside>;
}
function Topbar({
  role,
  onProfile,
  onLogout,
}: {
  role: Role;
  onProfile: () => void;
  onLogout: () => void;
}) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName =
    user?.name || (role === "student" ? "Alex Morgan" : "Ava Thompson");

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return (
    <header className="flex h-[76px] items-center justify-between border-b border-[#EAE4DB] bg-[#FDFBF7]/80 px-5 backdrop-blur md:px-9">
      <div className="flex items-center gap-3 lg:hidden">
        <Mark />
      </div>

      <div className="hidden text-sm font-semibold text-[#4C4B47] lg:block">
        {role === "student"
          ? "Tuesday, September 8, 2026"
          : "Tuesday, September 8, 2026 · Term 1"}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => toast("You’re all caught up")}
          className="relative grid h-9 w-9 place-items-center rounded-full border border-[#E9E2D8] bg-white text-[#858078] transition hover:border-[#FF674F] hover:text-[#FF674F]"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#FF674F]" />
        </button>

        <div className="hidden h-7 w-px bg-[#E9E2D8] sm:block" />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-full bg-white p-1 pr-2 text-xs font-bold text-[#55534F] shadow-sm transition hover:shadow-md sm:pr-3"
          >
            <Avatar
              initials={initials}
              color={role === "student" ? "#D98D6F" : "#7798D7"}
            />

            <span className="hidden sm:block">
              {displayName}
            </span>

            <ChevronDown
              className={`hidden h-3.5 w-3.5 text-[#99938A] transition-transform sm:block ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-12 z-50 w-[245px] overflow-hidden rounded-2xl border border-[#EAE4DB] bg-white shadow-[0_18px_50px_rgba(55,45,35,.14)]">
              <div className="border-b border-[#F0EBE3] bg-[#FDFBF7] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    initials={initials}
                    color={role === "student" ? "#D98D6F" : "#7798D7"}
                  />

                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[#252827]">
                      {displayName}
                    </div>

                    <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#AAA49B]">
                      {role}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onProfile();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#4C4B47] transition hover:bg-[#F8F5EF] hover:text-[#FF674F]"
                >
                  <UserRound className="h-4 w-4" />
                  Open profile
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#4C4B47] transition hover:bg-[#FFF0EA] hover:text-[#FF674F]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ProfileView({
  role,
  onBack,
}: {
  role: Role;
  onBack: () => void;
}) {
  const { user } = useAuth();

  const displayName =
    user?.name || (role === "student" ? "Alex Morgan" : "Ava Thompson");

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 md:px-9 md:py-11">
      <button
        onClick={onBack}
        className="mb-8 text-xs font-bold text-[#8A857D] transition hover:text-[#FF674F]"
      >
        ← Back to workspace
      </button>

      <p className="eyebrow">Account</p>

      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.055em]">
        Your profile<span className="text-[#FF674F]">.</span>
      </h1>

      <div className="mt-8 overflow-hidden rounded-[28px] border border-[#EAE4DB] bg-white">
        <div className="bg-[#F8F5EF] p-7 md:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar
              initials={initials}
              color={role === "student" ? "#D98D6F" : "#7798D7"}
            />

            <div>
              <h2 className="font-display text-2xl font-semibold text-[#252827]">
                {displayName}
              </h2>

              <p className="mt-1 text-sm text-[#8A857D]">
                {role === "student" ? "Student account" : "Teacher account"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-[#EAE4DB] sm:grid-cols-2">
          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#AAA49B]">
              Full name
            </p>
            <p className="mt-2 text-sm font-semibold text-[#3D3E3B]">
              {displayName}
            </p>
          </div>

          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#AAA49B]">
              Email
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-[#3D3E3B]">
              {user?.email || "Email not available"}
            </p>
          </div>

          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#AAA49B]">
              Account type
            </p>
            <p className="mt-2 text-sm font-semibold capitalize text-[#3D3E3B]">
              {role}
            </p>
          </div>

          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#AAA49B]">
              Login method
            </p>
            <p className="mt-2 text-sm font-semibold text-[#3D3E3B]">
              {user?.loginMethod || "Local account"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentOverview({
  setActive,
  resources,
  classes,
}: {
  setActive: (v: string) => void;
  resources: Resource[];
  classes: Array<{
    id: number;
    name: string;
    subjectName: string;
    subjectCode: string;
    teacherName: string | null;
    academicYear: string | null;
    description: string | null;
  }>;
}) {
  const [classIndex, setClassIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState(false);
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const questionFileInputRef = useRef<HTMLInputElement>(null);

  const studentQuestionsQuery = trpc.portal.studentQuestions.useQuery(undefined, {
    enabled: true,
  });

  const selectedClass =
    classes.length > 0
      ? classes[Math.min(classIndex, classes.length - 1)]
      : null;

  const createQuestionMutation = trpc.portal.createQuestion.useMutation({
    onSuccess: async () => {
      setQuery("");
      setQuestionFile(null);
      if (questionFileInputRef.current) {
        questionFileInputRef.current.value = "";
      }
      setSent(true);
      await studentQuestionsQuery.refetch();
      toast.success("Question sent to your teacher");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendQuestion = async () => {
    const message = query.trim();

    if (
      (!message && !questionFile) ||
      !selectedClass ||
      createQuestionMutation.isPending
    ) {
      return;
    }

    let fileData: string | undefined;

    if (questionFile) {
      const arrayBuffer = await questionFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      let binary = "";
      const chunkSize = 0x8000;

      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(
          i,
          Math.min(i + chunkSize, bytes.length),
        );
        binary += Array.from(
          chunk,
          (byte) => String.fromCharCode(byte),
        ).join("");
      }

      fileData = btoa(binary);
    }

    createQuestionMutation.mutate({
      classId: selectedClass.id,
      message: message || "Attachment",
      fileName: questionFile?.name,
      mimeType: questionFile?.type || undefined,
      fileSize: questionFile?.size,
      fileData,
    });
  };

  const handleQuestionFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      setQuestionFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File must be smaller than 50 MB.");
      event.target.value = "";
      setQuestionFile(null);
      return;
    }

    setQuestionFile(file);
  };

  if (!selectedClass) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-9 md:py-11">
        <p className="eyebrow">Student space</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.055em]">
          Your learning workspace.
        </h1>
        <p className="mt-3 text-sm text-[#8A857D]">
          You don't have any enrolled classes yet.
        </p>

        <div className="mt-10">
          <Empty
            title="No classes assigned"
            text="Your classes will appear here once an administrator enrolls you."
          />
        </div>
      </div>
    );
  }

  const teacherName = selectedClass.teacherName || "Your teacher";

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-9 md:py-11">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Student space</p>

          <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.055em] text-[#252827] sm:text-5xl">
            Good morning, {readStorage("brcm-student-name", "Student")}
            <span className="text-[#FF674F]">.</span>
          </h1>

          <p className="mt-3 text-sm text-[#8A857D]">
            Your BRCM learning workspace is ready.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-[#FCEAA2]/55 px-4 py-3">
          <span className="text-xl">✦</span>
          <div>
            <div className="text-xs font-bold text-[#665525]">
              Your learning space
            </div>
            <div className="text-[10px] text-[#8D7739]">
              Keep going with your classes
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-5 xl:grid-cols-[.9fr_1fr_1fr]">
        <div className="relative min-h-[260px] overflow-hidden rounded-[28px] bg-[#7798D7] p-6 text-white md:p-7">
          <div className="absolute right-[-10%] top-[-35%] h-[410px] w-[410px] rounded-full border border-white/20" />

          <div className="absolute right-[-5%] top-[-16%] font-display text-[170px] font-bold leading-none text-white/10">
            ◉
          </div>

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.24em] text-white/60">
                Your current class
              </div>

              <h2 className="mt-3 max-w-[68%] font-display text-3xl font-semibold leading-[.92] tracking-[-.055em]">
                {selectedClass.subjectName}
                <br />
                with {teacherName.split(" ").slice(-1)[0]}.
              </h2>
            </div>

            <div className="shrink-0 rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-center backdrop-blur">
              <div className="whitespace-nowrap font-display text-xl font-bold">
                {selectedClass.subjectCode}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                subject
              </div>
            </div>
          </div>

          <p className="relative mt-5 max-w-sm text-xs leading-5 text-white/70">
            {selectedClass.description ||
              `${selectedClass.subjectName} for ${selectedClass.name}.`}
          </p>

          <p className="relative mt-3 text-[11px] font-semibold text-white/60">
            Teacher · {teacherName}
          </p>

          <div className="relative mt-5 flex items-center gap-3">
            <button
              onClick={() => setActive("My subjects")}
              className="rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#7798D7]"
            >
              View class <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
            </button>

            {classes.length > 1 && (
              <>
                <button
                  aria-label="Previous class"
                  onClick={() =>
                    setClassIndex(
                      (i) => (i - 1 + classes.length) % classes.length,
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/15"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  aria-label="Next class"
                  onClick={() =>
                    setClassIndex((i) => (i + 1) % classes.length)
                  }
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/15"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#EAE4DB] bg-white p-7 md:p-9">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow">Quick ask</div>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">
                What’s on your mind?
              </h3>
            </div>

            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF0EA] text-[#FF674F]">
              <CircleHelp className="h-5 w-5" />
            </div>
          </div>

          {sent ? (
            <div className="mt-12 rounded-2xl bg-[#EAF2E9] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#487052]">
                <Check className="h-4 w-4" />
                Question saved to your inbox
              </div>

              <p className="mt-2 text-xs leading-5 text-[#66816B]">
                Your teacher can now see it in Questions.
              </p>

              <button
                onClick={() => setSent(false)}
                className="mt-4 text-xs font-bold text-[#487052] underline"
              >
                Ask another question
              </button>
            </div>
          ) : (
            <>
              <div className="mt-8 rounded-2xl bg-[#F8F5EF] p-4">
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Ask ${teacherName.split(" ").slice(-1)[0]} about ${selectedClass.subjectName.toLowerCase()}...`}
                  className="min-h-[95px] resize-none border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-[#ADA79E] focus-visible:ring-0"
                />

                {questionFile && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-white border p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Paperclip className="h-4 w-4 shrink-0 text-[#FF674F]" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#252827]">
                          {questionFile.name}
                        </p>
                        <p className="text-[10px] text-[#99938A]">
                          {formatFileSize(questionFile.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setQuestionFile(null);
                        if (questionFileInputRef.current) {
                          questionFileInputRef.current.value = "";
                        }
                      }}
                      className="text-xs font-bold text-[#FF674F]"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <input
                      ref={questionFileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                      className="hidden"
                      onChange={handleQuestionFileChange}
                    />

                    <button
                      type="button"
                      onClick={() => questionFileInputRef.current?.click()}
                      className="flex items-center gap-2 text-xs font-semibold text-[#99938A] transition hover:text-[#FF674F]"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      Attach file or image
                    </button>
                  </div>

                  <button
                    disabled={
                      (!query.trim() && !questionFile) ||
                      createQuestionMutation.isPending
                    }
                    onClick={sendQuestion}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#252827] text-white transition hover:bg-[#FF674F] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="mt-4 text-[10px] leading-4 text-[#AAA49B]">
                You can send a text question, an image, or another file.
                Your teacher's response will appear below.
              </p>

            </>
          )}
        </div>

        <div className="rounded-[28px] border border-[#EAE4DB] bg-white p-6 md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="eyebrow">Tickets</div>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em]">
                Teacher responses
              </h3>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#EAF2E9] text-[#487052]">
              <MessageCircle className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-2 text-xs leading-5 text-[#AAA49B]">
            Your questions and the replies from your teachers live here.
          </p>

          {studentQuestionsQuery.isLoading ? (
            <p className="mt-6 text-xs text-[#99938A]">Loading tickets...</p>
          ) : studentQuestionsQuery.data?.length ? (
            <div className="mt-5 max-h-[390px] space-y-3 overflow-y-auto pr-1">
              {studentQuestionsQuery.data.map((question) => (
                <div key={question.id} className="rounded-2xl border border-[#EAE4DB] bg-[#FDFBF7] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7798D7]">
                      {question.subjectCode}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${question.status === "answered" ? "bg-[#EAF2E9] text-[#487052]" : "bg-[#FFF0EA] text-[#C65B49]"}`}>
                      {question.status === "answered" ? "Answered" : "Open"}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-[#4D514F]">
                    {question.message}
                  </p>
                  {question.teacherResponse ? (
                    <div className="mt-3 rounded-xl bg-[#EAF2E9] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#487052]">Teacher response</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#3C5B45]">{question.teacherResponse}</p>
                      {question.teacherFileName && (
                        <a href={`/api/questions/${question.id}/teacher-file/view`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-[11px] font-semibold text-[#487052] hover:underline">
                          <Paperclip className="h-3 w-3" />
                          {question.teacherFileName}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] font-semibold text-[#B1ACA4]">Waiting for teacher response</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-[#F8F5EF] p-5 text-center">
              <MessageCircle className="mx-auto h-5 w-5 text-[#B1ACA4]" />
              <p className="mt-2 text-xs font-semibold text-[#6D6962]">No tickets yet</p>
              <p className="mt-1 text-[11px] leading-5 text-[#99938A]">Questions and teacher responses will appear here.</p>
            </div>
          )}
        </div>
      </div>

      <ResourceList
        resources={resources}
        onDownload={(resource) => {
          const link = document.createElement("a");
          link.href = `/api/materials/${resource.id}/download`;
          link.download = resource.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
        onOpen={(resource) => {
          window.open(
            `/api/materials/${resource.id}/view`,
            "_blank",
            "noopener,noreferrer",
          );
        }}
      />
    </div>
  );
}

function StudentResources({
  resources,
  classId,
  className,
}: {
  resources: Resource[];
  classId: number | null;
  className?: string;
}) {
  const filteredResources =
    classId === null
      ? resources
      : resources.filter((resource) => resource.classId === classId);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-9 md:py-11">
      <p className="eyebrow">Resources</p>

      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-[-.055em]">
            Your learning resources.
          </h1>

          <p className="mt-3 text-sm text-[#8A857D]">
            Files uploaded by your teachers are available here.
          </p>
        </div>

        <span className="rounded-full bg-[#EAF2E9] px-4 py-2 text-xs font-bold text-[#487052]">
          {filteredResources.length} {filteredResources.length === 1 ? "file" : "files"} available
        </span>
      </div>

      {filteredResources.length === 0 ? (
        <div className="mt-10">
          <Empty
            title={classId === null ? "No resources yet" : "No resources for this class"}
            text={
              classId === null
                ? "Your teachers haven't uploaded any resources for your enrolled classes yet."
                : `No resources have been uploaded for ${className || "this class"} yet.`
            }
          />
        </div>
      ) : (
        <div className="mt-10">
          <ResourceList
            resources={filteredResources}
            onOpen={(resource) => {
              window.open(
                `/api/materials/${resource.id}/view`,
                "_blank",
                "noopener,noreferrer",
              );
            }}
            onDownload={(resource) => {
              const link = document.createElement("a");
              link.href = `/api/materials/${resource.id}/download`;
              link.download = resource.name;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          />
        </div>
      )}
    </div>
  );
}

function ResourceList({
  resources,
  onDownload,
  onOpen,
}: {
  resources: Resource[];
  onDownload: (resource: Resource) => void;
  onOpen: (resource: Resource) => void;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Shared resources</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">
            Latest uploads
          </h2>
        </div>

        <span className="text-xs font-semibold text-[#9E9990]">
          {resources.length} files available
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="group flex items-center gap-4 rounded-2xl border border-[#EAE4DB] bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(75,63,48,.08)]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FFF0EA] text-[#FF674F]">
              <FileText className="h-5 w-5" />
            </span>

            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm text-[#3D3E3B]">
                {resource.name}
              </strong>

              <span className="mt-1 block text-[11px] text-[#9E9990]">
                {resource.type} · {resource.size} · {resource.createdAt}
              </span>
            </span>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpen(resource)}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Open
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(resource)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function StudentSubjects({
  resources,
  classes,
  setActive,
  onViewResources,
}: {
  resources: Resource[];
  setActive: (v: string) => void;
  onViewResources: (classId: number) => void;
  classes: Array<{
    id: number;
    name: string;
    subjectName: string;
    subjectCode: string;
    teacherName: string | null;
    academicYear: string | null;
    description: string | null;
  }>;
}) {
  const [selected, setSelected] = useState(0);

  if (classes.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-9 md:py-11">
        <p className="eyebrow">My subjects</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.055em]">
          Your learning space is ready.
        </h1>
        <div className="mt-9 rounded-[28px] border border-dashed border-[#E1D8CC] bg-white p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-[#C4BDB3]" />
          <h3 className="mt-4 font-display text-xl font-semibold">
            No classes assigned yet
          </h3>
          <p className="mt-2 text-sm text-[#8A857D]">
            Your enrolled classes will appear here once they are assigned.
          </p>
        </div>
      </div>
    );
  }

  const safeSelected = Math.min(selected, classes.length - 1);
  const selectedClass = classes[safeSelected];

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-9 md:py-11">
      <p className="eyebrow">My subjects</p>

      <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-[-.055em]">
            Your enrolled classes.
          </h1>
          <p className="mt-3 text-sm text-[#8A857D]">
            These are the classes assigned to your student account.
          </p>
        </div>

        {classes.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() =>
                setSelected(
                  (safeSelected - 1 + classes.length) % classes.length,
                )
              }
              className="grid h-9 w-9 place-items-center rounded-full border border-[#E3DDD4] bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() =>
                setSelected((safeSelected + 1) % classes.length)
              }
              className="grid h-9 w-9 place-items-center rounded-full border border-[#E3DDD4] bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setSelected(i)}
            className={`subject-card ${
              i === safeSelected ? "subject-card-selected" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EEF2FF] text-[#7798D7]">
                <BookOpen className="h-5 w-5" />
              </span>

              <span className="text-[10px] font-bold uppercase tracking-widest text-[#ADA79E]">
                {item.subjectCode}
              </span>
            </div>

            <div className="mt-16 text-left">
              <div className="text-sm font-bold text-[#3D3E3B]">
                {item.subjectName}
              </div>

              <div className="mt-1 text-xs text-[#9C968E]">
                {item.name}
              </div>

              <div className="mt-1 text-xs text-[#9C968E]">
                {item.teacherName}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-[28px] bg-[#7798D7] p-7 text-white md:p-9">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.2em] text-white/60">
              {selectedClass.subjectCode} · {selectedClass.academicYear}
            </div>

            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-.05em]">
              {selectedClass.subjectName}
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-white/75">
              {selectedClass.description ||
                `This class is taught by ${selectedClass.teacherName}.`}
            </p>

            <p className="mt-4 text-xs font-semibold text-white/60">
              Teacher · {selectedClass.teacherName}
            </p>
          </div>

          <button
            onClick={() => onViewResources(selectedClass.id)}
            className="rounded-full bg-white px-5 py-3 text-xs font-bold text-[#7798D7]"
          >
            View resources
            <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TeacherOverview({ setActive }: { setActive: (v: string) => void }) { const questions = readStorage<Question[]>("brcm-questions", []); return <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-9 md:py-11"><p className="eyebrow">Teacher space</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Hello, Ava<span className="text-[#7798D7]">.</span></h1><p className="mt-3 text-sm text-[#8A857D]">Publish resources and keep your classes moving.</p><div className="mt-10 grid gap-4 md:grid-cols-3"><button onClick={() => setActive("Resource library")} className="rounded-[24px] bg-[#252827] p-6 text-left text-white transition hover:-translate-y-1"><Upload className="h-5 w-5 text-[#FF674F]" /><div className="mt-10 font-display text-2xl font-semibold">Upload a resource</div><p className="mt-2 text-xs leading-5 text-white/55">Share a real file with every student in the workspace.</p></button><button onClick={() => setActive("Questions")} className="rounded-[24px] bg-[#DDE7F7] p-6 text-left text-[#30415D] transition hover:-translate-y-1"><MessageCircle className="h-5 w-5 text-[#617FAB]" /><div className="mt-10 font-display text-2xl font-semibold">{questions.filter((q) => !q.answered).length} open questions</div><p className="mt-2 text-xs leading-5 text-[#6A7B9B]">Reply to students from the live inbox.</p></button><button onClick={() => setActive("My classes")} className="rounded-[24px] bg-[#E7F0E8] p-6 text-left text-[#304438] transition hover:-translate-y-1"><Users className="h-5 w-5 text-[#6D9778]" /><div className="mt-10 font-display text-2xl font-semibold">3 active classes</div><p className="mt-2 text-xs leading-5 text-[#617463]">Mathematics, Physics, and Biology.</p></button></div><div className="mt-8 rounded-[28px] border border-[#EAE4DB] bg-white p-7"><div className="flex items-center justify-between"><div><p className="eyebrow">Workspace status</p><h2 className="mt-2 font-display text-2xl font-semibold">Everything is connected.</h2></div><Check className="h-6 w-6 text-[#7DAE92]" /></div><p className="mt-4 max-w-2xl text-sm leading-6 text-[#77736D]">Files you upload and questions students ask are saved in this browser, so the preview behaves like a real working portal instead of a static mockup.</p></div></div>; }

function TeacherSection({ active, resources, setResources }: { active: string; resources: Resource[]; setResources: (items: Resource[]) => void }) {
  const [title, setTitle] = useState("");

  const teacherQuestionsQuery = trpc.portal.teacherQuestions.useQuery(undefined, {
    enabled: active === "Questions",
  });

  const answerQuestionMutation = trpc.portal.answerQuestion.useMutation({
    onSuccess: async () => {
      await teacherQuestionsQuery.refetch();
      toast.success("Answer sent to student");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const upload = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const resource: Resource = { id: crypto.randomUUID(), name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, type: file.name.split(".").pop()?.toUpperCase() || "FILE", uploadedBy: "Ava Thompson", createdAt: "Just now" }; const next = [resource, ...resources]; setResources(next); localStorage.setItem("brcm-resources", JSON.stringify(next)); toast.success(`${file.name} uploaded`); event.target.value = ""; };
  const publish = () => { if (!title.trim()) return; const file: Resource = { id: crypto.randomUUID(), name: `${title.trim()}.resource`, size: "Text resource", type: "NOTE", uploadedBy: "Ava Thompson", createdAt: "Just now" }; const next = [file, ...resources]; setResources(next); localStorage.setItem("brcm-resources", JSON.stringify(next)); setTitle(""); toast.success("Resource published to students"); };
  if (active === "Questions") {
    const questions = teacherQuestionsQuery.data ?? [];

    return (
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-9 md:py-11">
        <p className="eyebrow">Questions</p>

        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.055em]">
          The inbox is a classroom too.
        </h1>

        <p className="mt-3 text-sm text-[#8A857D]">
          Questions sent by your students appear here in real time.
        </p>

        {teacherQuestionsQuery.isLoading ? (
          <div className="mt-9">
            <Empty
              title="Loading questions..."
              text="Checking your student inbox."
            />
          </div>
        ) : questions.length === 0 ? (
          <div className="mt-9">
            <Empty
              title="No questions yet"
              text="Student questions will appear here as they are sent."
            />
          </div>
        ) : (
          <div className="mt-9 space-y-4">
            {questions.map((q) => (
              <TeacherQuestionCard
                key={q.id}
                question={q}
                onAnswer={(questionId, teacherResponse) =>
                  answerQuestionMutation.mutate({
                    questionId,
                    teacherResponse,
                    fileName: undefined,
                    mimeType: undefined,
                    fileSize: undefined,
                    fileData: undefined,
                  })
                }
                answering={answerQuestionMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  if (active === "Resource library") return <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-9 md:py-11"><p className="eyebrow">Resource library</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.055em]">Give students something real to open.</h1><div className="mt-9 grid gap-4 md:grid-cols-[1.1fr_.9fr]"><label className="flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#E1D8CC] bg-white p-7 text-center transition hover:border-[#FF674F] hover:bg-[#FFF9F6]"><input type="file" className="sr-only" onChange={upload} /><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF0EA] text-[#FF674F]"><Upload className="h-6 w-6" /></span><strong className="mt-5 text-sm">Choose a file to upload</strong><span className="mt-2 text-xs text-[#9E9990]">PDF, DOCX, PPTX, images, or any class file</span></label><div className="rounded-[28px] bg-[#252827] p-7 text-white"><Plus className="h-5 w-5 text-[#FF674F]" /><h2 className="mt-8 font-display text-2xl font-semibold">Publish a quick note</h2><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm revision checklist" className="mt-5 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-[#FF674F]" /><Button onClick={publish} disabled={!title.trim()} className="mt-3 w-full rounded-xl bg-[#FF674F] text-white hover:bg-[#EC5744]">Publish to students</Button></div></div><div className="mt-10"><h2 className="font-display text-2xl font-semibold">Published resources</h2><div className="mt-4"><ResourceList
  resources={resources}
  onOpen={(resource) => {
    window.open(
      `/api/materials/${resource.id}/view`,
      "_blank",
      "noopener,noreferrer"
    );
  }}
  onDownload={(resource) => {
    const link = document.createElement("a");
    link.href = `/api/materials/${resource.id}/download`;
    link.download = resource.name;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }}
/></div></div></div>;
  return <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-9 md:py-11"><p className="eyebrow">{active}</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.055em]">Your classrooms, in view.</h1><div className="mt-9 grid gap-4 md:grid-cols-3">{["Year 10 · Mathematics", "Year 11 · Physics", "Year 9 · Biology"].map((item, i) => <div key={item} className="rounded-2xl border border-[#EAE4DB] bg-white p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF2E9] text-[#6D9778]"><BookOpen className="h-4 w-4" /></span><span className="text-xs font-bold text-[#9E9990]">{[32, 26, 28][i]} students</span></div><h3 className="mt-6 text-sm font-bold text-[#41433F]">{item}</h3><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#ECE6DD]"><div className="h-full rounded-full bg-[#7DAE92]" style={{ width: `${[78, 61, 69][i]}%` }} /></div><p className="mt-2 text-[10px] text-[#959087]">{[78, 61, 69][i]}% active this week</p></div>)}</div></div>;
}

function TeacherQuestionCard({
  question,
  onAnswer,
  answering,
}: {
  question: {
    id: number;
    studentName: string | null;
    studentEmail: string | null;
    className: string;
    subjectName: string;
    subjectCode: string;
    message: string;
    studentFileName: string | null;
    studentFileSize: number | null;
    teacherResponse: string | null;
    status: "open" | "answered" | "closed";
    createdAt: Date | string;
    answeredAt: Date | string | null;
  };
  onAnswer: (questionId: number, teacherResponse: string) => void;
  answering: boolean;
}) {
  const [response, setResponse] = useState(question.teacherResponse || "");

  const answered = question.status === "answered";

  const formatDate = (value: Date | string | null) => {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";

    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const submitAnswer = () => {
    const trimmed = response.trim();

    if (!trimmed || answering) return;

    onAnswer(question.id, trimmed);
  };

  return (
    <div className="rounded-[24px] border border-[#EAE4DB] bg-white p-6 md:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
            <Avatar
              initials={(question.studentName || "Student")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
              color="#D98D6F"
            />

            <div>
              <div className="text-sm font-bold text-[#3F403C]">
                {question.studentName || "Student"}
              </div>

              <div className="mt-0.5 text-[11px] text-[#99938A]">
                {question.studentEmail || "No email available"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[10px] font-bold text-[#617FAB]">
              {question.subjectCode}
            </span>

            <span className="rounded-full bg-[#F8F5EF] px-3 py-1 text-[10px] font-bold text-[#77736D]">
              {question.className}
            </span>

            <span
              className={
                answered
                  ? "rounded-full bg-[#EAF2E9] px-3 py-1 text-[10px] font-bold text-[#4C7558]"
                  : "rounded-full bg-[#FFF0EA] px-3 py-1 text-[10px] font-bold text-[#C65B47]"
              }
            >
              {answered ? "Answered" : "Open"}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-[#AAA49B]">
          {formatDate(question.createdAt)}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-[#F8F5EF] p-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#AAA49B]">
          Student question
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#5E5C57]">
          {question.message}
        </p>
      </div>

      {question.studentFileName && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#EAE4DB] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFF0EA] text-[#FF674F]">
              <FileText className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-[#4C4B47]">
                {question.studentFileName}
              </div>

              <div className="mt-1 text-[10px] text-[#AAA49B]">
                Student attachment
                {question.studentFileSize
                  ? ` · ${formatSize(question.studentFileSize)}`
                  : ""}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              onClick={() =>
                window.open(
                  `/api/questions/${question.id}/student-file/view`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              className="rounded-full border border-[#E1D8CC] px-3 py-2 text-[10px] font-bold text-[#5E5C57] transition hover:bg-[#F8F5EF]"
            >
              Open
            </button>

            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = `/api/questions/${question.id}/student-file/download`;
                link.download = question.studentFileName || "attachment";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="rounded-full bg-[#252827] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#FF674F]"
            >
              Download
            </button>
          </div>
        </div>
      )}

      <div className="mt-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#AAA49B]">
          Your response
        </div>

        {answered ? (
          <div className="mt-3 rounded-2xl bg-[#EAF2E9] p-5">
            <p className="whitespace-pre-wrap text-sm leading-6 text-[#4C6350]">
              {question.teacherResponse || "Answered"}
            </p>

            {question.answeredAt && (
              <p className="mt-3 text-[10px] text-[#7B927F]">
                Answered {formatDate(question.answeredAt)}
              </p>
            )}
          </div>
        ) : (
          <>
            <textarea
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              placeholder="Write your answer or feedback..."
              className="mt-3 min-h-[120px] w-full resize-none rounded-2xl border border-[#E1D8CC] bg-[#FCFAF7] p-4 text-sm leading-6 text-[#4C4B47] outline-none transition placeholder:text-[#AAA49B] focus:border-[#FF674F]"
            />

            <div className="mt-3 flex justify-end">
              <button
                disabled={!response.trim() || answering}
                onClick={submitAnswer}
                className="rounded-full bg-[#FF674F] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#EC5744] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {answering ? "Sending..." : "Send answer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) { return <div className="rounded-2xl border border-dashed border-[#E1D8CC] bg-white p-10 text-center"><MessageCircle className="mx-auto h-7 w-7 text-[#C4BDB3]" /><h3 className="mt-4 font-display text-xl font-semibold">{title}</h3><p className="mt-2 text-sm text-[#8A857D]">{text}</p></div>; }

export default function Portal() {
  const [, setLocation] = useLocation();
  const { user, loading, logout } = useAuth();

  const role: Role = user?.role === "teacher" ? "teacher" : "student";

  const studentMaterialsQuery = trpc.portal.studentMaterials.useQuery(undefined, {
    enabled: !!user && user.role === "student",
  });

  const studentClassesQuery = trpc.portal.studentClasses.useQuery(undefined, {
    enabled: !!user && user.role === "student",
  });

  const studentResources: Resource[] = (studentMaterialsQuery.data ?? []).map(
    (material) => ({
      id: String(material.id),
      name: material.fileName,
      classId: material.classId,
      size:
        (material.fileSize ?? 0) >= 1024 * 1024
          ? `${((material.fileSize ?? 0) / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round((material.fileSize ?? 0) / 1024))} KB`,
      type: material.mimeType?.split("/").pop()?.toUpperCase() || "FILE",
      uploadedBy: "Teacher",
      createdAt: new Date(material.createdAt).toLocaleDateString(),
      fileUrl: material.fileUrl ?? undefined,
    }),
  );

  const [active, setActive] = useState("Overview");
  const [studentResourceClassId, setStudentResourceClassId] = useState<number | null>(null);
  const [resources, setResources] = useState<Resource[]>(() =>
    readStorage("brcm-resources", initialResources)
  );

  const exit = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      return;
    }

    setLocation("/");
  };

  const main = useMemo(() => {
    if (active === "Profile") {
      return <ProfileView role={role} onBack={() => setActive("Overview")} />;
    }

    if (role === "student") {
      if (active === "My subjects") {
        return <StudentSubjects
          resources={studentResources}
          classes={studentClassesQuery.data ?? []}
          setActive={setActive}
          onViewResources={(classId) => {
            setStudentResourceClassId(classId);
            setActive("Resources");
          }}
        />;
      }

      if (active === "Resources") {
        return <StudentResources
          resources={studentResources}
          classId={studentResourceClassId}
          className={
            studentClassesQuery.data?.find(
              (classItem) => classItem.id === studentResourceClassId,
            )?.name
          }
        />;
      }

      return <StudentOverview setActive={setActive} resources={studentResources} classes={studentClassesQuery.data ?? []} />;
    }

    if (active === "Overview") {
      return <TeacherOverview setActive={setActive} />;
    }

    return (
      <TeacherSection
        active={active}
        resources={resources}
        setResources={setResources}
      />
    );
  }, [role, active, resources, studentResources]);

  const mobileItems =
    role === "student"
      ? ["Overview", "My subjects", "Resources"]
      : ["Overview", "My classes", "Questions", "Resource library"];

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FDFBF7]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#EAE4DB] border-t-[#FF674F]" />
          <p className="mt-4 text-sm text-[#8A857D]">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  if (user.role === "teacher") {
    setLocation("/teacher");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] text-[#252827]">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        onExit={exit}
      />

      <div className="min-w-0 flex-1">
        <Topbar
          role={role}
          onProfile={() => setActive("Profile")}
          onLogout={exit}
        />

        <div className="border-b border-[#F0EBE3] bg-white/60 px-5 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {mobileItems.map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold ${
                  active === item
                    ? "bg-[#252827] text-white"
                    : "bg-[#F4F0EA] text-[#89847C]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#F0EBE3] bg-[#FDFBF7] px-5 py-3 md:px-9">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#AAA49B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7DAE92]" />
            {role === "student"
              ? "Student workspace"
              : "Teacher workspace"}
          </div>
        </div>

        {main}
      </div>
    </div>
  );
}
