import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Portal from "@/pages/Portal";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AdminPortal from "./pages/AdminPortal";
import TeacherPortal from "./pages/TeacherPortal";
import TeacherAttendance from "./pages/TeacherAttendance";
import TeacherTickets from "./pages/TeacherTickets";
import TeacherClasses from "./pages/TeacherClasses";
import TeacherAssignments from "./pages/TeacherAssignments";
import AdminTeachers from "./pages/AdminTeachers";
import AdminSubjects from "./pages/AdminSubjects";
import AdminClasses from "./pages/AdminClasses";
import AdminEnrollments from "./pages/AdminEnrollments";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Auth} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/portal" component={Portal} />
      <Route path="/teacher/classes" component={TeacherClasses} />
      <Route path="/teacher/assignments" component={TeacherAssignments} />
      <Route path="/teacher/attendance" component={TeacherAttendance} />
      <Route path="/teacher/tickets" component={TeacherTickets} />

  <Route path="/teacher" component={TeacherPortal} />
      <Route path="/admin" component={AdminPortal} />
      <Route path="/admin/teachers" component={AdminTeachers} />
  <Route path="/admin/subjects" component={AdminSubjects} />
  <Route path="/admin/classes" component={AdminClasses} />
  <Route path="/admin/enrollments" component={AdminEnrollments} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
