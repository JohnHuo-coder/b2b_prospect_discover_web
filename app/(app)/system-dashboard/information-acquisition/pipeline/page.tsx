import { Suspense } from "react";
import { InformationAcquisitionPipelinePage } from "@/components/system-dashboard/pipeline/InformationAcquisitionPipelinePage";

export default function InformationAcquisitionPipelineRoutePage() {
  return (
    <Suspense fallback={<div className="px-6 py-6 text-sm text-zinc-500">Loading pipeline...</div>}>
      <InformationAcquisitionPipelinePage />
    </Suspense>
  );
}
