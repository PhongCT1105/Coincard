import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext.tsx"; // store the login state

export default function SignIn() {
  const [, setLocation] = useLocation();
  const { login } = useAuth(); // Get the login function from our context
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // To show login errors

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        login(userData.user);
        setLocation("/");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Invalid username or password.");
      }
    } catch (err) {
      console.error("Sign in failed:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-white">CoinCard</h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to your account</p>
        </div>

        <div className="rounded-md border border-gray-800 bg-[#0d0d0d] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your username"
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
                placeholder="Enter your password"
              />
            </div>

            {/* Show error message if login fails */}
            {error && (<div className="text-center text-sm text-red-500" data-testid="error-message">{error}</div>)}

            <Button
              type="submit"
              data-testid="button-signin"
              disabled={isLoading}
              className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" data-testid="link-signup">
              <span className="text-white hover:underline cursor-pointer">Sign Up</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
