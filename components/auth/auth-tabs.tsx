"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

export function AuthTabs({ defaultTab = "login" }: { defaultTab?: "login" | "signup" }) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="login">התחברות</TabsTrigger>
        <TabsTrigger value="signup">הרשמה</TabsTrigger>
      </TabsList>
      <TabsContent value="login" className="mt-0">
        <LoginForm />
      </TabsContent>
      <TabsContent value="signup" className="mt-0">
        <SignupForm />
      </TabsContent>
    </Tabs>
  );
}
