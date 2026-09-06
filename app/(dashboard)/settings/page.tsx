import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="הגדרות" description="הגדרות הסטודיו." />
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          תפקידי משתמשים, העדפות התראות ואינטגרציות יופיעו כאן.
        </CardContent>
      </Card>
    </div>
  );
}
