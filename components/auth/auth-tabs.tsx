"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

export function AuthTabs({ defaultTab = "login" }: { defaultTab?: "login" | "signup" }) {
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="login">התחברות</TabsTrigger>
        <TabsTrigger value="signup">הרשמה</TabsTrigger>
      </TabsList>
      <TabsContent value="login" className="mt-0">
        <LoginForm onSwitchToSignup={() => setTab("signup")} />
      </TabsContent>
      <TabsContent value="signup" className="mt-0">
        <SignupForm />
      </TabsContent>
    </Tabs>
  );
}
