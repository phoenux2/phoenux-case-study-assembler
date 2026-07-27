import Link from "next/link";

import { CreateProjectForm } from "@/components/projects/create-project-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            New project
          </h1>
          <p className="text-muted-foreground">
            Start a reconstruction workspace for one engagement.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/projects" />} nativeButton={false}>
          Back
        </Button>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>
            Everything stays draft until evidence and approvals exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
