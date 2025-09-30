'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("ProtectedRoute useEffect - loading:", loading, "user:", user, "requiredRole:", requiredRole);
    if (!loading) {
      if (!user) {
        console.log("ProtectedRoute: No user, redirecting to login");
        // User is not authenticated, redirect to appropriate login
        const loginPath = requiredRole === 'owner' 
          ? '/auth/owner/login' 
          : '/auth/customer/login';
        router.push(redirectTo || loginPath);
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        console.log("ProtectedRoute: Role mismatch, user role:", user.role, "required:", requiredRole);
        // User doesn't have the required role
        if (user.role === 'customer') {
          router.push('/customer/home');
        } else if (user.role === 'owner') {
          router.push('/owner/dashboard');
        } else {
          router.push('/');
        }
        return;
      }
      console.log("ProtectedRoute: Access granted");
    }
  }, [user, loading, requiredRole, redirectTo, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user is not authenticated or doesn't have required role
  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}