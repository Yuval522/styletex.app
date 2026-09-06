import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Studio configuration." />
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          User roles, notification preferences, and integrations will live here.
        </CardContent>
      </Card>
    </div>
  );
}
