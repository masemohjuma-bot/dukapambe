import { createFileRoute } from "@tanstack/react-router";
import { guardSeller } from "@/lib/seller/service";
import { SellerLayout } from "@/components/seller/SellerLayout";
export const Route = createFileRoute("/seller/dashboard")({
  ssr: false,
  beforeLoad: () => guardSeller("dashboard"),
  component: SellerDashboardEntry,
});
// No seller dashboard exists in this checkout. This protected entry deliberately
// provides no invented metrics, products, or dashboard redesign.
function SellerDashboardEntry() {
  return (
    <SellerLayout title="Seller Dashboard">
      <p>Your approved Seller account is ready.</p>
      <p className="mt-3 text-muted-foreground">
        Seller access is available after application approval.
      </p>
      <a href="/" className="mt-4 inline-block text-teal-800 underline">
        Return to Dukapambe
      </a>
    </SellerLayout>
  );
}
