// ===========================================================================
//  App.tsx — routes and role gates. Three portals, one app:
//    /student…  career & major → university / college → mentor (optional), Pro
//    /mentor…   requests, availability, sessions, profile
//    /admin…    dashboard, payments, mentors, students, universities, content
//  Each portal has its own sign-in page; nobody can open another role's pages.
// ===========================================================================
import type { ComponentType } from "react";
import { Link, Redirect, Route, Switch } from "wouter";
import { AppShell, adminCan } from "@/components/AppShell";
import { Spinner, Toaster } from "@/components/ui";
import { homeFor, useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import type { Role } from "@/lib/api";

import Landing from "@/pages/Landing";
import Guide from "@/pages/Guide";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MentorApply from "@/pages/MentorApply";
import NotFound from "@/pages/NotFound";

import Start from "@/pages/student/Start";
import Quiz from "@/pages/student/Quiz";
import Results from "@/pages/student/Results";
import Movies from "@/pages/student/Movies";
import ChooseCareer from "@/pages/student/ChooseCareer";
import Majors from "@/pages/student/Majors";
import Explorer from "@/pages/student/Explorer";
import Compare from "@/pages/student/Compare";
import Mentors from "@/pages/student/Mentors";
import Plan from "@/pages/student/Plan";
import Pro from "@/pages/student/Pro";

import MentorDashboard from "@/pages/mentor/Dashboard";
import MentorRequests from "@/pages/mentor/Requests";
import MentorAvailability from "@/pages/mentor/Availability";
import MentorSessions from "@/pages/mentor/Sessions";
import MentorProfile from "@/pages/mentor/Profile";

import AdminOverview from "@/pages/admin/Overview";
import AdminPayments from "@/pages/admin/Payments";
import AdminPaymentAccounts from "@/pages/admin/PaymentAccounts";
import AdminMentors from "@/pages/admin/Mentors";
import AdminStudents from "@/pages/admin/Students";
import AdminUniversities from "@/pages/admin/Universities";
import AdminContent from "@/pages/admin/Content";
import AdminAdmins from "@/pages/admin/Admins";

function guard(role: Role, Page: ComponentType, path?: string) {
  return function Guarded() {
    const { user, loading, isGuest } = useAuth();
    if (loading) return <Spinner />;
    if (!user) {
      if (role === "student" && isGuest) return <Page />;
      return <Redirect to={role === "student" ? "/login" : `/${role}/login`} />;
    }
    if (user.role !== role) return <Redirect to={homeFor(user.role)} />;
    if (role === "admin" && path && !adminCan(user.adminRole, path)) return <Redirect to="/admin" />;
    return <Page />;
  };
}
const S = (p: ComponentType) => guard("student", p);
const M = (p: ComponentType) => guard("mentor", p);
const A = (p: ComponentType, path: string) => guard("admin", p, path);

// created once, at module load
const G_Start = S(Start);
const G_Quiz = S(Quiz);
const G_Results = S(Results);
const G_Movies = S(Movies);
const G_ChooseCareer = S(ChooseCareer);
const G_Majors = S(Majors);
const G_Explorer = S(Explorer);
const G_Compare = S(Compare);
const G_Mentors = S(Mentors);
const G_Plan = S(Plan);
function StudentProRoute() {
  const { user, loading, isGuest } = useAuth();
  const { t } = usePrefs();
  if (loading) return <Spinner />;
  if (isGuest) return <section className="card mx-auto flex max-w-lg flex-col items-center gap-3 text-center"><p className="eyebrow">CareerNet Pro</p><h1 className="text-2xl">{t("Create an account to view Pro")}</h1><p className="text-muted">{t("Guest sessions cannot submit payments or save progress.")}</p><div className="flex flex-wrap justify-center gap-2"><Link href="/register" className="btn-primary">{t("Create an account")}</Link><Link href="/student/compare" className="btn-ghost">{t("Continue")}</Link></div></section>;
  if (!user) return <Redirect to="/login" />;
  if (user.role !== "student") return <Redirect to={homeFor(user.role)} />;
  return <Pro />;
}
const G_Pro = StudentProRoute;
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
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/guide" component={Guide} />
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
      <Toaster />
    </AppShell>
  );
}
