"use client";

import React from "react";
import AuthForm from "@/components/AuthForm";
import { useSupabase } from "@/components/SupabaseProvider";
import { Navigate } from "react-router-dom";

const AuthPage = () => {
  const { session, isLoading } = useSupabase();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading authentication...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <AuthForm />
    </div>
  );
};

export default AuthPage;