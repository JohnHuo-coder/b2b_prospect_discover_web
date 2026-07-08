import { Suspense } from "react";
import { OutreachPipelinePage } from "@/components/system-dashboard/pipeline/OutreachPipelinePage";

export default function OutreachPipelineRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-6 text-sm text-zinc-500">Loading pipeline...</div>
      }
    >
      <OutreachPipelinePage />
    </Suspense>
  );
}
