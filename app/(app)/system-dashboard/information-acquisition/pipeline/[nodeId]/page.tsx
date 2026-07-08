import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PipelineNodeCandidatesPage } from "@/components/system-dashboard/pipeline/PipelineNodeCandidatesPage";
import { getPipelineNodeMeta } from "@/lib/system-dashboard/information-acquisition-pipeline-flow";

export default async function PipelineNodeCandidatesRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ nodeId: string }>;
  searchParams: Promise<{ requirement_index?: string }>;
}) {
  const { nodeId } = await params;
  const { requirement_index: requirementIndexParam } = await searchParams;
  const node = getPipelineNodeMeta(nodeId);
  const requirementIndex = Number(requirementIndexParam);

  if (!node) {
    return (
      <div className="px-6 py-6">
        <Link
          href="/system-dashboard/information-acquisition/pipeline"
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

  if (!Number.isFinite(requirementIndex)) {
    return (
      <div className="px-6 py-6">
        <Link
          href="/system-dashboard/information-acquisition/pipeline"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-violet-600 transition hover:text-violet-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Pipeline
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{node.label}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Open this step from the pipeline with a requirement selected.
        </p>
      </div>
    );
  }

  return (
    <PipelineNodeCandidatesPage
      node={node}
      requirementIndex={requirementIndex}
    />
  );
}
