import { redirect } from "next/navigation";

// Registration now lives directly on the main login page (a "הרשמה" tab
// next to "התחברות"), so this separate route is no longer used — it just
// forwards here in case anything still links to it.
export default function SetupPage() {
  redirect("/login?tab=signup");
}
