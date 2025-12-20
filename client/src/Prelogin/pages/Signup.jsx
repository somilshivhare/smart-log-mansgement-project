import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import PageWrapper from "../../components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import AlertModal from "@/components/ui/AlertModal";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [alertState, setAlertState] = useState({
    open: false,
    title: "",
    message: "",
    primaryLabel: "OK",
    onPrimary: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setAlertState({
        open: true,
        title: "Validation",
        message: "Passwords do not match",
        primaryLabel: "OK",
        onPrimary: () => setAlertState({ open: false }),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_PATH}/citizen/auth/signup`,
        {
          name: fullName,
          email,
          password,
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        setAlertState({
          open: true,
          title: "Success",
          message: "Account created successfully! Please login.",
          primaryLabel: "OK",
          onPrimary: () => {
            setAlertState({ open: false });
            navigate("/login");
          },
        });
      } else {
        setAlertState({
          open: true,
          title: "Failed",
          message: res.data.message || "Signup failed",
          primaryLabel: "OK",
          onPrimary: () => setAlertState({ open: false }),
        });
      }
    } catch (err) {
      setAlertState({
        open: true,
        title: "Error",
        message:
          err?.response?.data?.message ||
          "Network error. Please try again later.",
        primaryLabel: "OK",
        onPrimary: () => setAlertState({ open: false }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PageWrapper>
        <div className="flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md animate-[fade-in-up_0.6s_ease-out]">
            <div className="text-center mb-8">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition-opacity"
              >
                <ShieldCheck className="h-10 w-10 text-primary" />
                <span className="text-2xl font-bold text-foreground">
                  DocVerify
                </span>
              </Link>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Create Account
              </h1>
              <p className="text-muted-foreground">
                Get started with secure document verification
              </p>
            </div>
            <Card className="p-8 shadow-lg" glass>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="fullName"
                    className="text-foreground font-medium"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-foreground font-medium"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-foreground font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={isSubmitting}
                      className="h-11 pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 focus:outline-none"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-foreground font-medium"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-11 pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 focus:outline-none"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      tabIndex={-1}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 text-base hover:scale-105 transition-transform duration-200 font-medium mt-6"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
              <p className="text-xs text-center text-muted-foreground mt-4">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">Or</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary font-medium hover:text-accent transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </Card>
            <AlertModal
              open={alertState.open}
              title={alertState.title}
              message={alertState.message}
              primaryLabel={alertState.primaryLabel}
              onPrimary={
                alertState.onPrimary || (() => setAlertState({ open: false }))
              }
            />
            <div className="text-center mt-6"></div>
            <div className="text-center mt-6">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
