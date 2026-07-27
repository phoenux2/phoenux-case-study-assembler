import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AddTextSourceForm,
  UploadFileForm,
} from "@/components/projects/source-forms";
import { QuestionEnginePanel } from "@/components/projects/question-engine";
import { AssemblyPanel } from "@/components/projects/assembly-panel";
import { AiPipelinePanel } from "@/components/projects/ai-pipeline-panel";
import { Phase4Panel } from "@/components/projects/phase4-panel";
import { ProjectSectionNav } from "@/components/projects/section-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSessionUser } from "@/lib/auth/session";
import { listAssets } from "@/lib/services/assets";
import { getProject } from "@/lib/services/projects";
import { getCoverageSnapshot } from "@/lib/services/questions";
import { listSources } from "@/lib/services/sources";
import { listClaims, listContentBlocks } from "@/lib/services/blocks";
import { listOutputs } from "@/lib/services/outputs";
import { getAiStatus, listFacts } from "@/lib/services/ai-pipeline";
import { listKnowledge } from "@/lib/services/knowledge";
import { figmaStatus } from "@/lib/services/figma";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) notFound();

  const project = await getProject(id, user.id);
  if (!project) notFound();

  const [sources, assets, blocks, claims, outputs, facts, knowledge] = await Promise.all([
    listSources(project.id),
    listAssets(project.id),
    listContentBlocks(project.id),
    listClaims(project.id),
    listOutputs(project.id),
    listFacts(project.id),
    listKnowledge(project.id),
  ]);
  const coverage = await getCoverageSnapshot(project, sources, assets);
  const aiStatus = getAiStatus();
  const figma = figmaStatus();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {project.title}
            </h1>
            <Badge variant="outline">{project.approval}</Badge>
            <Badge variant="secondary">{project.confidence}</Badge>
            <Badge variant="outline">
              {Math.round(coverage.score * 100)}% coverage
            </Badge>
          </div>
          {project.client_name ? (
            <p className="text-muted-foreground">{project.client_name}</p>
          ) : null}
          {project.summary ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {project.summary}
            </p>
          ) : null}
        </div>
        <Button
          variant="outline"
          render={<Link href="/projects" />}
          nativeButton={false}
        >
          All projects
        </Button>
      </div>

      <ProjectSectionNav projectId={project.id} />

      <section id="questions" className="scroll-mt-32">
      <QuestionEnginePanel
        projectId={project.id}
        coverage={coverage}
        assets={assets}
      />
      </section>

      <section id="assembly" className="scroll-mt-32">
      <AssemblyPanel
        projectId={project.id}
        blocks={blocks}
        claims={claims}
        assets={assets}
        outputs={outputs}
      />
      </section>

      <section id="ai-pipeline" className="scroll-mt-32">
      <AiPipelinePanel
        projectId={project.id}
        aiEnabled={aiStatus.enabled}
        provider={aiStatus.provider}
        facts={facts}
        claims={claims}
      />
      </section>

      <section id="phase4" className="scroll-mt-32">
      <Phase4Panel
        projectId={project.id}
        assets={assets}
        knowledge={knowledge}
        figmaConfigured={figma.configured}
      />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add text source</CardTitle>
            <CardDescription>
              Notes, proposals, emails — stored with provenance, no AI extraction
              yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddTextSourceForm projectId={project.id} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upload file</CardTitle>
            <CardDescription>
              Screenshots become reusable assets with permission metadata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadFileForm projectId={project.id} />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <section id="sources" className="flex scroll-mt-32 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-semibold">Sources</h2>
          <p className="text-sm text-muted-foreground">
            Evidence inputs for later extraction and gap detection.
          </p>
        </div>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sources yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Approval</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{source.source_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {source.content_summary || source.filename || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{source.approval}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section id="assets" className="flex scroll-mt-32 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-semibold">Assets</h2>
          <p className="text-sm text-muted-foreground">
            Reusable images — never duplicated per page.
          </p>
        </div>
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No image assets yet. Upload an image file to create one.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Approval</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.title}</TableCell>
                  <TableCell>{asset.phase}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{asset.permission}</Badge>
                  </TableCell>
                  <TableCell>{asset.quality}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{asset.approval}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
