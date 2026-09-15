import { useMemo } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
} from "lucide-react";

type Assignment = {
  id: number;
  title: string;
  description?: string | null;
  classId: number;
  dueDate?: Date | string | null;
  isPublished?: boolean;
};

type DeadlineTrackerProps = {
  assignments: Assignment[];
  onOpen?: (assignmentId: number) => void;
};

type DeadlineItem = Assignment & {
  status: "overdue" | "today" | "this-week" | "upcoming";
  urgency: number;
  dueTime: number;
  label: string;
  countdown: string;
};

function getDeadlineInfo(dueDate: Date | string) {
  const now = new Date();
  const due = new Date(dueDate);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - startOfWeekDay(startOfToday)));
  endOfWeek.setHours(23, 59, 59, 999);

  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status: DeadlineItem["status"];
  let urgency: number;
  let label: string;
  let countdown: string;

  if (due.getTime() < now.getTime()) {
    status = "overdue";
    urgency = 0;
    label = "Overdue";

    const overdueDays = Math.max(
      1,
      Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24)),
    );

    countdown = overdueDays === 1
      ? "1 day overdue"
      : `${overdueDays} days overdue`;
  } else if (due >= startOfToday && due < startOfTomorrow) {
    status = "today";
    urgency = 1;
    label = "Due today";

    if (diffHours < 1) {
      countdown = "Due in less than 1 hour";
    } else {
      countdown = `Due in ${Math.ceil(diffHours)} hours`;
    }
  } else if (due <= endOfWeek) {
    status = "this-week";
    urgency = 2;
    label = "This week";

    countdown = diffDays === 1
      ? "1 day left"
      : `${diffDays} days left`;
  } else {
    status = "upcoming";
    urgency = 3;
    label = "Upcoming";

    countdown = diffDays === 1
      ? "1 day left"
      : `${diffDays} days left`;
  }

  return {
    status,
    urgency,
    label,
    countdown,
    dueTime: due.getTime(),
  };
}

function startOfWeekDay(date: Date) {
  // Monday = 0 ... Sunday = 6
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDueDate(value: Date | string) {
  const date = new Date(value);

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function statusClasses(status: DeadlineItem["status"]) {
  switch (status) {
    case "overdue":
      return {
        badge: "bg-red-50 text-red-700 border-red-100",
        icon: "text-red-600",
        bar: "bg-red-500",
      };

    case "today":
      return {
        badge: "bg-orange-50 text-orange-700 border-orange-100",
        icon: "text-orange-600",
        bar: "bg-orange-500",
      };

    case "this-week":
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-100",
        icon: "text-amber-600",
        bar: "bg-amber-500",
      };

    default:
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
        icon: "text-emerald-600",
        bar: "bg-emerald-500",
      };
  }
}

export default function SmartDeadlineTracker({
  assignments,
  onOpen,
}: DeadlineTrackerProps) {
  const deadlines = useMemo<DeadlineItem[]>(() => {
    return assignments
      .filter(
        (assignment) =>
          assignment.isPublished !== false &&
          assignment.dueDate,
      )
      .map((assignment) => ({
        ...assignment,
        ...getDeadlineInfo(assignment.dueDate!),
      }))
      .sort(
        (a, b) =>
          a.urgency - b.urgency ||
          a.dueTime - b.dueTime,
      );
  }, [assignments]);

  const summary = useMemo(() => {
    return {
      overdue: deadlines.filter((item) => item.status === "overdue").length,
      today: deadlines.filter((item) => item.status === "today").length,
      thisWeek: deadlines.filter((item) => item.status === "this-week").length,
    };
  }, [deadlines]);

  return (
    <section className="rounded-[28px] border border-[#EAE4DB] bg-white p-6 shadow-[0_12px_35px_rgba(63,56,45,.05)] md:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#AAA49B]">
            <CalendarClock className="h-3.5 w-3.5" />
            Smart planner
          </div>

          <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em] text-[#252827]">
            Your deadlines
          </h2>

          <p className="mt-1 text-xs leading-5 text-[#8A857D]">
            Everything is automatically sorted by urgency.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {summary.overdue > 0 && (
            <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-700">
              {summary.overdue} overdue
            </span>
          )}

          {summary.today > 0 && (
            <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[10px] font-bold text-orange-700">
              {summary.today} today
            </span>
          )}

          {summary.thisWeek > 0 && (
            <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700">
              {summary.thisWeek} this week
            </span>
          )}
        </div>
      </div>

      {deadlines.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E7E1D7] bg-[#FCFAF6] px-5 py-8 text-center">
          <CheckCircle2 className="mx-auto h-7 w-7 text-[#7DAE92]" />

          <h3 className="mt-3 text-sm font-bold text-[#353735]">
            You’re all clear
          </h3>

          <p className="mt-1 text-xs text-[#918C84]">
            No published assignments with deadlines are waiting for you.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {deadlines.slice(0, 6).map((assignment) => {
            const styles = statusClasses(assignment.status);

            return (
              <div
                key={assignment.id}
                className="group relative overflow-hidden rounded-2xl border border-[#EEE9E1] bg-[#FCFAF7] p-4 transition hover:-translate-y-0.5 hover:border-[#DDD5CA] hover:shadow-sm"
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${styles.bar}`}
                />

                <div className="flex flex-col gap-4 pl-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold ${styles.badge}`}
                      >
                        {assignment.status === "overdue" ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : assignment.status === "today" ? (
                          <Clock3 className="h-3 w-3" />
                        ) : (
                          <CalendarClock className="h-3 w-3" />
                        )}

                        {assignment.label}
                      </span>

                      <span className="text-[10px] font-semibold text-[#A29D95]">
                        {formatDueDate(assignment.dueDate!)}
                      </span>
                    </div>

                    <h3 className="mt-2 truncate text-sm font-bold text-[#303331]">
                      {assignment.title}
                    </h3>

                    {assignment.description && (
                      <p className="mt-1 line-clamp-1 text-xs text-[#8B867E]">
                        {assignment.description}
                      </p>
                    )}

                    <div
                      className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold ${styles.icon}`}
                    >
                      <Clock3 className="h-3 w-3" />
                      {assignment.countdown}
                    </div>
                  </div>

                  {onOpen && (
                    <button
                      type="button"
                      onClick={() => onOpen(assignment.id)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#252827] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#3A3D3B]"
                    >
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deadlines.length > 6 && (
        <div className="mt-4 text-center text-[10px] font-semibold text-[#9B968E]">
          Showing the 6 most urgent deadlines
        </div>
      )}
    </section>
  );
}
