import { Suspense } from "react";
import { ContactPipelinePage } from "@/components/system-dashboard/pipeline/ContactPipelinePage";

export default function ContactPipelineRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-6 text-sm text-zinc-500">Loading pipeline...</div>
      }
    >
      <ContactPipelinePage />
    </Suspense>
  );
}
