import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext.tsx"; // store the login state

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.user);
        setLocation("/");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "An unknown error occurred.");
      }
    } catch (err) {
      console.error("Sign up failed:", err);
      setError("Cannot connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-white">CoinCard</h1>
          <p className="mt-2 text-sm text-gray-400">Create your account</p>
        </div>

        <div className="rounded-md border border-gray-800 bg-[#0d0d0d] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/50 p-4 text-sm text-destructive" data-testid="text-error">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium uppercase tracking-wide text-gray-300">
                Username
              </Label>
              <Input
                id="username"
                data-testid="input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 border-gray-800 bg-[#0d0d0d] text-white placeholder:text-gray-600 focus:border-gray-700"
                placeholder="Choose a username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium uppercase tracking-wide text-gray-300">
                Password
              </Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-gray-800 bg-[#0d0d0d] text-white placeholder:text-gray-600 focus:border-gray-700"
                placeholder="Create a password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium uppercase tracking-wide text-gray-300">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                data-testid="input-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 border-gray-800 bg-[#0d0d0d] text-white placeholder:text-gray-600 focus:border-gray-700"
                placeholder="Confirm your password"
              />
            </div>

            {error && (<div className="text-center text-sm text-red-500" data-testid="error-message">{error}</div>)}

            <Button
              type="submit"
              data-testid="button-signup"
              disabled={isLoading}
              className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/signin" data-testid="link-signin">
              <span className="text-white hover:underline cursor-pointer">Sign In</span>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-white">New accounts start with $100,000.00 USD balance</p>
      </div>
    </div>
  );
}
