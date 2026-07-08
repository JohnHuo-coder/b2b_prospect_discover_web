import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ContactPipelineNodeCandidatesPage } from "@/components/system-dashboard/pipeline/ContactPipelineNodeCandidatesPage";
import { getContactNodeMeta } from "@/lib/system-dashboard/contact-pipeline-flow";

export default async function ContactPipelineNodeRoutePage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;
  const node = getContactNodeMeta(nodeId);

  if (!node) {
    return (
      <div className="px-6 py-6">
        <Link
          href="/system-dashboard/contact/pipeline"
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

  return <ContactPipelineNodeCandidatesPage node={node} />;
}
