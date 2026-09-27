"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type Tab = "login" | "signup" | "reset";

export function AuthTabs({ defaultTab = "login" }: { defaultTab?: "login" | "signup" }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-3">
        <TabsTrigger value="login">התחברות</TabsTrigger>
        <TabsTrigger value="signup">הרשמה</TabsTrigger>
        <TabsTrigger value="reset">שכחתי סיסמה</TabsTrigger>
      </TabsList>
      <TabsContent value="login" className="mt-0">
        <LoginForm onSwitchToSignup={() => setTab("signup")} onSwitchToReset={() => setTab("reset")} />
      </TabsContent>
      <TabsContent value="signup" className="mt-0">
        <SignupForm onSwitchToReset={() => setTab("reset")} />
      </TabsContent>
      <TabsContent value="reset" className="mt-0">
        <ResetPasswordForm />
      </TabsContent>
    </Tabs>
  );
}
