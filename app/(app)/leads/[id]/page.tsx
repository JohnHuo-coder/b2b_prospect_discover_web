import { LeadDetailContent } from "@/components/leads/LeadDetailContent";

type LeadDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  return <LeadDetailContent leadId={id} />;
}
