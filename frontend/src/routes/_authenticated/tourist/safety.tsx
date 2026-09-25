import { createFileRoute } from "@tanstack/react-router";
import { SafetyInfoBrowser } from "@/components/app/SafetyBrowse";
import { PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/tourist/safety")({
  component: TouristSafetyInfoPage,
});

function TouristSafetyInfoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety Information"
        desc="Verified guidance on emergency procedures, medical care, lost travel documents, and local safety advisories."
      />
      <SafetyInfoBrowser />
    </div>
  );
}
