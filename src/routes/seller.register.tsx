import { createFileRoute } from "@tanstack/react-router";
import { guardSeller } from "@/lib/seller/service";
import { SellerWizard } from "@/components/seller/SellerWizard";
export const Route = createFileRoute("/seller/register")({
  ssr: false,
  beforeLoad: () => guardSeller("register"),
  component: SellerWizard,
});
