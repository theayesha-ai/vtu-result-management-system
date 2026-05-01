import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  GraduationCap,
  Loader2,
  ShieldCheck,
} from "lucide-react";
/**
 * LandingPage — the entry point with Student Login and Admin Login tabs.
 * Student login: enter USN + Name, fetch results, verify name match.
 * Admin login: Internet Identity + isCallerAdmin() check.
 */
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { useStudentLogin } from "../hooks/useQueries";

export default function LandingPage() {
  const navigate = useNavigate();
  const { setStudentResults, setIsAdminLoggedIn } = useAppContext();

  // ─── Student Login State ────────────────────────────────────────
  const [usn, setUsn] = useState("");
  const [name, setName] = useState("");
  const [studentError, setStudentError] = useState("");

  const studentLoginMutation = useStudentLogin();

  async function handleStudentLogin(e: React.FormEvent) {
    e.preventDefault();
    setStudentError("");

    const usnTrimmed = usn.trim().toUpperCase();
    const nameTrimmed = name.trim();

    if (!usnTrimmed) return setStudentError("Please enter your USN.");
    if (!nameTrimmed) return setStudentError("Please enter your name.");

    try {
      const results = await studentLoginMutation.mutateAsync({
        usn: usnTrimmed,
        name: nameTrimmed,
      });
      setStudentResults(results);
      navigate({ to: "/result" });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Login failed. Please check your USN and Name.";
      setStudentError(msg);
    }
  }

  // ─── Admin Login State ──────────────────────────────────────────
  const { login, loginStatus, isLoggingIn, identity } = useInternetIdentity();
  const { actor } = useActor(createActor);
  const [adminCheckPending, setAdminCheckPending] = useState(false);
  const [adminError, setAdminError] = useState("");

  async function handleAdminLogin() {
    setAdminError("");
    try {
      await login();
    } catch {
      setAdminError("Login cancelled or failed.");
    }
  }

  // After identity is set, check admin role
  async function handleCheckAdmin() {
    if (!actor) return;
    setAdminCheckPending(true);
    setAdminError("");
    try {
      const isAdmin = await (
        actor as unknown as { isCallerAdmin(): Promise<boolean> }
      ).isCallerAdmin();
      if (isAdmin) {
        setIsAdminLoggedIn(true);
        toast.success("Welcome, Admin!");
        navigate({ to: "/admin" });
      } else {
        setAdminError("You are not authorized as an admin.");
      }
    } catch {
      setAdminError("Authorization check failed. Please try again.");
    } finally {
      setAdminCheckPending(false);
    }
  }

  const isLoggedInWithII = loginStatus === "success" && !!identity;

  return (
    <div className="min-h-screen bg-background">
      {/* ─── VTU Header ─────────────────────────────────────────── */}
      <header className="vtu-header-gradient text-white">
        {/* Gold accent bar */}
        <div className="h-1 vtu-gold-accent" />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <img
              src="/assets/generated/vtu-emblem-transparent.dim_120x120.png"
              alt="VTU Emblem"
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Visvesvaraya Technological University
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                Jnana Sangama, Belagavi, Karnataka — 590018
              </p>
            </div>
          </div>
        </div>
        {/* Sub-header bar */}
        <div className="bg-gold/20 border-t border-gold/30 px-4 py-2">
          <div className="container mx-auto">
            <p className="text-center text-gold text-sm font-semibold tracking-widest uppercase">
              Student Result Management Portal
            </p>
          </div>
        </div>
      </header>

      {/* ─── Hero Stats ─────────────────────────────────────────── */}
      <div className="bg-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-6 justify-center text-center">
            {[
              { icon: BookOpen, label: "B.Tech / B.E Programs", value: "60+" },
              {
                icon: GraduationCap,
                label: "Affiliated Colleges",
                value: "220+",
              },
              {
                icon: Award,
                label: "Academic Excellence",
                value: "Since 1998",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-gold" />
                <span className="font-semibold text-foreground">{value}</span>
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Login Area ────────────────────────────────────── */}
      <main className="container mx-auto px-4 py-12 max-w-lg">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="font-display text-3xl font-bold text-foreground">
            Result Portal
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Access your academic results using your University Seat Number
          </p>
        </div>

        <Card className="shadow-navy-lg border-border animate-slide-up">
          <CardContent className="pt-6">
            <Tabs defaultValue="student">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger
                  value="student"
                  className="gap-2"
                  data-ocid="login.tab"
                >
                  <GraduationCap className="w-4 h-4" />
                  Student Login
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="gap-2"
                  data-ocid="admin.login.tab"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Login
                </TabsTrigger>
              </TabsList>

              {/* ─── Student Login Tab ─────────────────────────── */}
              <TabsContent value="student">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-display">
                    Student Sign In
                  </CardTitle>
                  <CardDescription>
                    Enter your USN and registered name to view your results
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="usn">University Seat Number (USN)</Label>
                    <Input
                      id="usn"
                      placeholder="e.g. 4MU24EC024"
                      value={usn}
                      onChange={(e) => {
                        setUsn(e.target.value);
                        setStudentError("");
                      }}
                      autoComplete="username"
                      className="uppercase font-mono tracking-wider"
                      data-ocid="student.login.input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="studentName">Full Name</Label>
                    <Input
                      id="studentName"
                      placeholder="As registered in records"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setStudentError("");
                      }}
                      autoComplete="name"
                      data-ocid="student.name.input"
                    />
                  </div>

                  {studentError && (
                    <div
                      className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
                      data-ocid="result.error_state"
                    >
                      {studentError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    disabled={studentLoginMutation.isPending}
                    data-ocid="student.login.submit_button"
                  >
                    {studentLoginMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "View My Results"
                    )}
                  </Button>
                </form>

                {studentLoginMutation.isPending && (
                  <div
                    className="mt-3 text-center text-xs text-muted-foreground"
                    data-ocid="result.loading_state"
                  >
                    Fetching your academic records...
                  </div>
                )}
              </TabsContent>

              {/* ─── Admin Login Tab ───────────────────────────── */}
              <TabsContent value="admin">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-display">
                    Administrator Access
                  </CardTitle>
                  <CardDescription>
                    Authenticate with Internet Identity to access the admin
                    panel
                  </CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  {!isLoggedInWithII ? (
                    <Button
                      onClick={handleAdminLogin}
                      disabled={isLoggingIn}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-ocid="admin.login.submit_button"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Sign in with Internet Identity
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-md bg-success/10 border border-success/20 px-3 py-2 text-sm text-success-foreground">
                        <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                        <span>
                          Identity verified. Click below to access admin panel.
                        </span>
                      </div>
                      <Button
                        onClick={handleCheckAdmin}
                        disabled={adminCheckPending}
                        className="w-full bg-gold hover:bg-gold-dark text-accent-foreground font-semibold"
                        data-ocid="admin.login.submit_button"
                      >
                        {adminCheckPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking permissions...
                          </>
                        ) : (
                          "Enter Admin Dashboard"
                        )}
                      </Button>
                    </div>
                  )}

                  {adminError && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                      {adminError}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Only authorized VTU administrators can access this panel.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Notice */}
        <div className="mt-6 rounded-md bg-accent/10 border border-accent/20 px-4 py-3 text-sm text-accent-foreground/80 text-center">
          <strong className="text-accent-foreground">Note:</strong> Results are
          provisional and subject to verification. Contact your institution for
          official transcripts.
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="vtu-header-gradient text-white/70 text-center text-xs py-4 mt-8">
        <p>
          © {new Date().getFullYear()} Visvesvaraya Technological University.
          All Rights Reserved.
        </p>
        <p className="mt-1">
          Built with <span className="text-gold">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline text-white/80 hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
