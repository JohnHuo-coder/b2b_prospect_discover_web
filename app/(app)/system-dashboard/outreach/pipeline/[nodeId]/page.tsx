import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { OutreachPipelineNodeCandidatesPage } from "@/components/system-dashboard/pipeline/OutreachPipelineNodeCandidatesPage";
import { getOutreachNodeMeta } from "@/lib/system-dashboard/outreach-pipeline-flow";

export default async function OutreachPipelineNodeRoutePage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;
  const node = getOutreachNodeMeta(nodeId);

  if (!node) {
    return (
      <div className="px-6 py-6">
        <Link
          href="/system-dashboard/outreach/pipeline"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-violet-600 transition hover:text-violet-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Pipeline
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Step not found</h1>
        <p className="mt-1 text-sm text-gray-500">
          No pipeline step matches &quot;{nodeId}&quot;.
        </p>
      </div>
    );
  }

  return <OutreachPipelineNodeCandidatesPage node={node} />;
}
