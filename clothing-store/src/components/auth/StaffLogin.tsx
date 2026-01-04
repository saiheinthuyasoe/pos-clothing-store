"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, LoginFormData } from "@/types/schemas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export function StaffLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError, user } = useAuth();
  const router = useRouter();

  // Handle redirect when user is authenticated
  useEffect(() => {
    if (user) {
      if (user.role === "manager" || user.role === "staff") {
        // Redirect to appropriate page based on role
        // For now, both go to owner/home (can be customized later)
        router.push("/owner/home");
      } else if (user.role === "owner") {
        router.push("/owner/dashboard");
      }
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    clearError();

    try {
      // Try to login as manager first (suppress error display)
      try {
        await login(data, "manager");
        router.push("/owner/home");
        return;
      } catch (managerError) {
        // Manager login failed, clear the error before trying staff
        clearError();
      }

      // Try to login as staff (this error will be shown if it fails)
      try {
        await login(data, "staff");
        router.push("/owner/home");
        return;
      } catch (staffError) {
        // Both failed - the error is already set by login(), just log it
        console.error("Staff login error:", staffError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <Users className="h-8 w-8 text-gray-700" />
            </div>
          </div>
          <h2 className="text-2xl font-normal text-gray-900">Staff Sign In</h2>
          <p className="mt-2 text-sm text-gray-600">
            Login for managers and staff members
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} onClose={clearError} />}

          <div className="border border-gray-300 p-4 mb-4">
            <p className="text-sm text-gray-700">
              <strong>Staff Account:</strong> Your account is created by the
              owner. If you need access, please contact your administrator.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              {...register("email")}
              type="email"
              label="Email Address"
              placeholder="Enter your staff email"
              error={errors.email?.message}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Enter your password"
                error={errors.password?.message}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              Sign In as Staff
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <Link
                href="/auth/owner/login"
                className="text-gray-900 underline"
              >
                Are you an owner? Sign in here
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Need help? Contact your administrator for account assistance.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
