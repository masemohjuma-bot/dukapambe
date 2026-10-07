import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  applicationComments,
  eligibility,
  friendlyError,
  guardSeller,
  sellerReceipt,
} from "@/lib/seller/service";
import { sellerDestination } from "@/lib/seller/model";
import { SellerLayout } from "@/components/seller/SellerLayout";
export const Route = createFileRoute("/seller/status")({
  ssr: false,
  beforeLoad: () => guardSeller("status"),
  component: SellerStatus,
});
function SellerStatus() {
  const router = useRouter();
  const [status, setStatus] = useState("Loading…");
  const [error, setError] = useState("");
  const [comments, setComments] = useState<{ id: string; comment: string; created_at: string }[]>(
    [],
  );
  const [receipt, setReceipt] = useState<Awaited<ReturnType<typeof sellerReceipt>> | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const context = await eligibility("/seller/status");
        if (!active) return;
        const destination = sellerDestination(
          context.seller?.application_status,
          context.profile.status,
        );
        if (destination === "/seller/dashboard") {
          await router.navigate({ href: destination });
          return;
        }
        setStatus(
          ["SUSPENDED", "BLOCKED", "DISABLED"].includes(context.profile.status)
            ? context.profile.status
            : (context.seller?.application_status ?? "DRAFT"),
        );
        setComments(await applicationComments(context.user.id));
        if (context.seller) setReceipt(await sellerReceipt(context.user.id));
        setError("");
      } catch (e) {
        if (active) setError(friendlyError(e));
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [router]);
  const canEdit = ["DRAFT", "REJECTED", "MORE_INFORMATION_REQUIRED"].includes(status);
  return (
    <SellerLayout title="Seller Application Status">
      <p role="status" className="text-xl font-semibold">
        {status.replaceAll("_", " ")}
      </p>
      {error && (
        <p role="alert" className="mt-4 text-destructive">
          {error}
        </p>
      )}
      {receipt && (
        <dl className="mt-4 space-y-2">
          <dt>Seller ID</dt>
          <dd className="break-all">{receipt.sellerId}</dd>
          <dt>Application ID</dt>
          <dd className="break-all">{receipt.application?.id ?? "Not yet started"}</dd>
          <dt>Store ID</dt>
          <dd className="break-all">{receipt.store?.id ?? "Created on submission"}</dd>
          <dt>Application Date</dt>
          <dd>
            {receipt.application?.submitted_at
              ? new Date(receipt.application?.submitted_at).toLocaleString()
              : "Not yet submitted"}
          </dd>
        </dl>
      )}
      <p className="mt-4 text-muted-foreground">
        {canEdit
          ? "Continue your application or update your information and resubmit."
          : status === "SUSPENDED" || status === "BLOCKED" || status === "DISABLED"
            ? "Your seller account is restricted. Contact support for assistance."
            : "Your application is awaiting review. This page checks for updates automatically."}
      </p>
      {canEdit && (
        <a
          href="/seller/register"
          className="mt-4 inline-block font-semibold text-teal-800 underline"
        >
          {status === "DRAFT" ? "Resume onboarding" : "Edit & resubmit"}
        </a>
      )}
      <h2 className="mt-6 font-semibold">Review comments</h2>
      {comments.length ? (
        comments.map((c) => (
          <article key={c.id} className="mt-3 rounded border p-3">
            <p className="whitespace-pre-wrap">{c.comment}</p>
            <time className="text-xs text-muted-foreground">
              {new Date(c.created_at).toLocaleString()}
            </time>
          </article>
        ))
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No review comments yet.</p>
      )}
    </SellerLayout>
  );
}
