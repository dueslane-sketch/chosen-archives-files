"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EnvDisplay = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <Card className="w-full max-w-md mt-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-700">
      <CardHeader>
        <CardTitle className="text-center text-lg text-yellow-800 dark:text-yellow-200">
          Supabase Environment Variables (for debugging)
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
        <p>
          <strong>VITE_SUPABASE_URL:</strong>{" "}
          <span className="font-mono break-all">{supabaseUrl || "NOT SET"}</span>
        </p>
        <p>
          <strong>VITE_SUPABASE_ANON_KEY:</strong>{" "}
          <span className="font-mono break-all">
            {supabaseAnonKey ? "******** (set)" : "NOT SET"}
          </span>
        </p>
        <p className="text-xs mt-2">
          If these are "NOT SET" or "YOUR_SUPABASE_URL", please ensure your{" "}
          <code className="bg-yellow-100 dark:bg-yellow-800 p-1 rounded">.env.local</code> file in the project root has the correct values.
        </p>
      </CardContent>
    </Card>
  );
};

export default EnvDisplay;