// ===========================================================================
//  App.tsx — routes and role gates. Three portals, one app:
//    /student…  career & major → university / college → mentor (optional), Pro
//    /mentor…   requests, availability, sessions, profile
//    /admin…    dashboard, payments, mentors, students, universities, content
//  Each portal has its own sign-in page; nobody can open another role's pages.
// ===========================================================================
import { lazy, Suspense, type ComponentType } from "react";
import { Link, Redirect, Route, Switch } from "wouter";
import { AppShell, adminCan } from "@/components/AppShell";
import { ErrorNote, Spinner, Toaster } from "@/components/ui";
import { homeFor, useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import type { Role } from "@/lib/api";
import { useJourney } from "@/lib/journey";
import { JOURNEY_PATHS, studentProgress, studentRouteRedirect } from "@/lib/studentFlow";

const SiteInfo = lazy(() => import("@/pages/SiteInfo"));
const Landing = lazy(() => import("@/pages/Landing"));
const Guide = lazy(() => import("@/pages/Guide"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const MentorApply = lazy(() => import("@/pages/MentorApply"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const Start = lazy(() => import("@/pages/student/Start"));
const Quiz = lazy(() => import("@/pages/student/Quiz"));
const Results = lazy(() => import("@/pages/student/Results"));
const Movies = lazy(() => import("@/pages/student/Movies"));
const ChooseCareer = lazy(() => import("@/pages/student/ChooseCareer"));
const Majors = lazy(() => import("@/pages/student/Majors"));
const Explorer = lazy(() => import("@/pages/student/Explorer"));
const Compare = lazy(() => import("@/pages/student/Compare"));
const Mentors = lazy(() => import("@/pages/student/Mentors"));
const Plan = lazy(() => import("@/pages/student/Plan"));
const Pro = lazy(() => import("@/pages/student/Pro"));
const StudentAccount = lazy(() => import("@/pages/student/Account"));

const MentorDashboard = lazy(() => import("@/pages/mentor/Dashboard"));
const MentorRequests = lazy(() => import("@/pages/mentor/Requests"));
const MentorAvailability = lazy(() => import("@/pages/mentor/Availability"));
const MentorSessions = lazy(() => import("@/pages/mentor/Sessions"));
const MentorProfile = lazy(() => import("@/pages/mentor/Profile"));

const AdminOverview = lazy(() => import("@/pages/admin/Overview"));
const AdminPayments = lazy(() => import("@/pages/admin/Payments"));
const AdminPaymentAccounts = lazy(() => import("@/pages/admin/PaymentAccounts"));
const AdminMentors = lazy(() => import("@/pages/admin/Mentors"));
const AdminStudents = lazy(() => import("@/pages/admin/Students"));
const AdminUniversities = lazy(() => import("@/pages/admin/Universities"));
const AdminContent = lazy(() => import("@/pages/admin/Content"));
const AdminAdmins = lazy(() => import("@/pages/admin/Admins"));

function guard(role: Role, Page: ComponentType, path?: string) {
  return function Guarded() {
    const { user, loading, isGuest } = useAuth();
    const { j, ready, content, contentLoading } = useJourney();
    if (loading) return <Spinner />;
    if (!user && !(role === "student" && isGuest)) {
      return <Redirect to={role === "student" ? "/login" : `/${role}/login`} />;
    }
    if (user && user.role !== role) return <Redirect to={homeFor(user.role)} />;
    if (role === "admin" && path && !adminCan(user?.adminRole, path)) return <Redirect to="/admin" />;
    if (role === "student" && path && JOURNEY_PATHS.includes(path)) {
      if (!ready || contentLoading) return <Spinner />;
      if (!content) return <ErrorNote message="Could not load the career quiz. Please reload to continue." onRetry={() => window.location.reload()} />;
      const redirect = studentRouteRedirect(path, studentProgress(j, content), j.level, user?.isPro);
      if (redirect) return <Redirect to={redirect} />;
    }
    return <Page />;
  };
}
const S = (p: ComponentType, path: string) => guard("student", p, path);
const M = (p: ComponentType) => guard("mentor", p);
const A = (p: ComponentType, path: string) => guard("admin", p, path);

// created once, at module load
const G_Start = S(Start, "/student");
const G_Quiz = S(Quiz, "/student/quiz");
const G_Results = S(Results, "/student/results");
const G_Movies = S(Movies, "/student/movies");
const G_ChooseCareer = S(ChooseCareer, "/student/career");
const G_Majors = S(Majors, "/student/majors");
const G_Explorer = S(Explorer, "/student/explorer");
const G_Compare = S(Compare, "/student/compare");
const G_Mentors = S(Mentors, "/student/mentors");
const G_Plan = S(Plan, "/student/plan");
function StudentProRoute() {
  const { user, loading, isGuest } = useAuth();
  const { t } = usePrefs();
  if (loading) return <Spinner />;
  if (isGuest) return <section className="card mx-auto flex max-w-lg flex-col items-center gap-3 text-center"><p className="eyebrow">CareerNest Pro</p><h1 className="text-2xl">{t("Create an account to view Pro")}</h1><p className="text-muted">{t("Guest sessions cannot submit payments or save progress.")}</p><div className="flex flex-wrap justify-center gap-2"><Link href="/register" className="btn-primary">{t("Create an account")}</Link><Link href="/student/compare" className="btn-ghost">{t("Continue")}</Link></div></section>;
  if (!user) return <Redirect to="/login" />;
  if (user.role !== "student") return <Redirect to={homeFor(user.role)} />;
  return <Pro />;
}
const G_Pro = StudentProRoute;
const G_StudentAccount = S(StudentAccount, "/student/profile");
const G_MentorDashboard = M(MentorDashboard);
const G_MentorRequests = M(MentorRequests);
const G_MentorAvailability = M(MentorAvailability);
const G_MentorSessions = M(MentorSessions);
const G_MentorProfile = M(MentorProfile);
const G_AdminOverview = A(AdminOverview, "/admin");
const G_AdminPayments = A(AdminPayments, "/admin/payments");
const G_AdminPaymentAccounts = A(AdminPaymentAccounts, "/admin/payment-accounts");
const G_AdminMentors = A(AdminMentors, "/admin/mentors");
const G_AdminStudents = A(AdminStudents, "/admin/students");
const G_AdminUniversities = A(AdminUniversities, "/admin/universities");
const G_AdminContent = A(AdminContent, "/admin/content");
const G_AdminAdmins = A(AdminAdmins, "/admin/admins");

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<Spinner />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/guide" component={Guide} />
        <Route path="/about">{() => <SiteInfo page="about" />}</Route>
        <Route path="/contact">{() => <SiteInfo page="contact" />}</Route>
        <Route path="/privacy">{() => <SiteInfo page="privacy" />}</Route>
        <Route path="/login">{() => <Login portal="student" />}</Route>
        <Route path="/register" component={Register} />
        <Route path="/mentor/login">{() => <Login portal="mentor" />}</Route>
        <Route path="/mentor/apply" component={MentorApply} />
        <Route path="/admin/login">{() => <Login portal="admin" />}</Route>

        <Route path="/student" component={G_Start} />
        <Route path="/student/quiz" component={G_Quiz} />
        <Route path="/student/results" component={G_Results} />
        <Route path="/student/movies" component={G_Movies} />
        <Route path="/student/career" component={G_ChooseCareer} />
        <Route path="/student/majors" component={G_Majors} />
        <Route path="/student/explorer" component={G_Explorer} />
        <Route path="/student/compare" component={G_Compare} />
        <Route path="/student/mentors" component={G_Mentors} />
        <Route path="/student/plan" component={G_Plan} />
        <Route path="/student/pro" component={G_Pro} />
        <Route path="/student/profile" component={G_StudentAccount} />

        <Route path="/mentor" component={G_MentorDashboard} />
        <Route path="/mentor/requests" component={G_MentorRequests} />
        <Route path="/mentor/availability" component={G_MentorAvailability} />
        <Route path="/mentor/sessions" component={G_MentorSessions} />
        <Route path="/mentor/profile" component={G_MentorProfile} />

        <Route path="/admin" component={G_AdminOverview} />
        <Route path="/admin/payments" component={G_AdminPayments} />
        <Route path="/admin/payment-accounts" component={G_AdminPaymentAccounts} />
        <Route path="/admin/mentors" component={G_AdminMentors} />
        <Route path="/admin/students" component={G_AdminStudents} />
        <Route path="/admin/universities" component={G_AdminUniversities} />
        <Route path="/admin/content" component={G_AdminContent} />
        <Route path="/admin/admins" component={G_AdminAdmins} />
        <Route component={NotFound} />
      </Switch>
      </Suspense>
      <Toaster />
    </AppShell>
  );
}
