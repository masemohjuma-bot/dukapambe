import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { documentKinds, fields, steps, validateStep } from "@/lib/seller/model";
import { friendlyError, submitApplication } from "@/lib/seller/service";
import { useSellerOnboarding } from "@/hooks/use-seller-onboarding";
import { DocumentUpload } from "./DocumentUpload";
import { SellerLayout, sellerButton } from "./SellerLayout";
export function SellerWizard() {
  const h = useSellerOnboarding();
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [terms, setTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { step, data, documents, setStep } = h;
  const errors = validateStep(step, data, documents);
  const validSteps = [0, 1, 2, 3, 4].filter((i) => validateStep(i, data, documents).length === 0);
  let unlocked = 0;
  while (unlocked < 5 && validSteps.includes(unlocked)) unlocked++;
  useEffect(() => {
    if (step > unlocked) setStep(unlocked);
  }, [step, unlocked, setStep]);
  async function go(next: number) {
    h.setError("");
    try {
      if (step < 5) await h.persist(step, next > step);
      h.setStep(next);
    } catch (e) {
      h.setError(friendlyError(e));
    }
  }
  async function submit() {
    h.setError("");
    try {
      await h.exclusive(async () => {
        const app = h.applicationRef.current;
        if (!app) throw new Error("Application is still loading.");
        await submitApplication(app.revision, confirmed, terms);
      });
      setSubmitted(true);
      setTimeout(() => void router.navigate({ href: "/seller/status" }), 1200);
    } catch (e) {
      h.setError(friendlyError(e));
    }
  }
  if (submitted)
    return (
      <SellerLayout title="Application submitted">
        <div role="status" className="animate-in fade-in zoom-in-95 py-12 text-center">
          <span className="text-5xl text-teal-700">✓</span>
          <p className="mt-4">Your application has been saved for review.</p>
          <a href="/seller/status" className="mt-4 inline-block underline">
            View application status
          </a>
        </div>
      </SellerLayout>
    );
  return (
    <SellerLayout title="Become a Seller">
      <p className="mb-4 text-muted-foreground">
        Upgrade your existing Buyer account. Your progress is saved securely after each step.
      </p>
      <div
        role="progressbar"
        aria-valuenow={Math.round((unlocked / 6) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Onboarding progress"
        className="h-2 overflow-hidden rounded bg-muted"
      >
        <div
          className="h-full bg-teal-700 transition-all"
          style={{ width: `${(unlocked / 6) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-sm">
        {Math.round((unlocked / 6) * 100)}% complete · {h.saved || "Loading application…"}
      </p>
      <nav className="my-6 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Onboarding steps">
        {steps.map((name, i) => (
          <button
            key={name}
            type="button"
            disabled={!h.application || h.busy || i > unlocked}
            aria-current={i === step ? "step" : undefined}
            onClick={() => void go(i)}
            className={`rounded border p-3 text-left text-sm disabled:opacity-40 ${i === step ? "border-teal-700 bg-teal-50 font-bold" : ""}`}
          >
            {i < unlocked ? "✓ " : ""}
            {i + 1}. {name}
          </button>
        ))}
      </nav>
      {h.error && (
        <div role="alert" className="mb-4 rounded border border-destructive p-3 text-destructive">
          {h.error}
          <div className="mt-2 flex gap-4">
            <button
              type="button"
              onClick={() =>
                void (
                  !h.application ? h.initialize() : step < 5 ? h.persist(step) : h.refresh()
                ).catch((e) => h.setError(friendlyError(e)))
              }
              disabled={h.busy}
              className="underline"
            >
              Retry
            </button>
            <a href="/login?next=%2Fseller%2Fregister" className="underline">
              Sign in
            </a>
            <button type="button" onClick={() => window.location.reload()} className="underline">
              Reload
            </button>
          </div>
        </div>
      )}
      {h.application && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 5) void submit();
            else if (!errors.length) void go(step + 1);
            else h.setError(errors.join(" "));
          }}
        >
          <h2 className="mb-4 text-xl font-semibold">{steps[step]}</h2>
          <fieldset disabled={h.busy} className="grid gap-4 sm:grid-cols-2">
            {(fields[step] ?? []).map((f) => (
              <div key={f.key}>
                <label htmlFor={f.key} className="block text-sm font-medium">
                  {f.label}
                  {f.optional ? " (optional)" : " *"}
                </label>
                {f.choices ? (
                  <select
                    id={f.key}
                    value={data[step]?.[f.key] ?? ""}
                    onChange={(e) => h.update(f.key, e.target.value)}
                    required={!f.optional}
                    className="mt-1 w-full rounded border bg-background p-2"
                  >
                    <option value="">Choose…</option>
                    {f.choices.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                ) : f.key.includes("description") || f.key.includes("address") ? (
                  <textarea
                    id={f.key}
                    value={data[step]?.[f.key] ?? ""}
                    onChange={(e) => h.update(f.key, e.target.value)}
                    required={!f.optional}
                    maxLength={2000}
                    className="mt-1 w-full rounded border bg-background p-2"
                  />
                ) : (
                  <input
                    id={f.key}
                    type={f.type ?? "text"}
                    value={data[step]?.[f.key] ?? ""}
                    onChange={(e) => h.update(f.key, e.target.value)}
                    required={!f.optional}
                    maxLength={2000}
                    min={f.type === "number" ? 0 : undefined}
                    max={f.type === "number" ? 200 : undefined}
                    step={f.type === "number" ? 1 : undefined}
                    className="mt-1 w-full rounded border bg-background p-2"
                  />
                )}
              </div>
            ))}
          </fieldset>
          {step === 2 && (
            <div className="space-y-4">
              {documentKinds.map((d) => (
                <DocumentUpload
                  key={d.kind}
                  kind={d.kind}
                  label={`${d.label}${d.required || (d.kind === "company_registration" && data[0]?.["business_type"] === "Limited Company") ? " *" : " (optional)"}`}
                  document={documents.find((x) => x.kind === d.kind)}
                  disabled={h.busy}
                  onChange={h.refresh}
                  onError={h.setError}
                  runOperation={h.exclusive}
                />
              ))}
            </div>
          )}
          {step === 4 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {["logo", "banner"].map((kind) => (
                <DocumentUpload
                  key={kind}
                  kind={kind}
                  label={`Store ${kind} *`}
                  document={documents.find((d) => d.kind === kind)}
                  disabled={h.busy}
                  onChange={h.refresh}
                  onError={h.setError}
                  runOperation={h.exclusive}
                />
              ))}
            </div>
          )}
          {step === 5 && (
            <div className="space-y-6">
              {steps.slice(0, 5).map((name, i) => (
                <section key={name} className="rounded border p-4">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-semibold">{name}</h3>
                    <button
                      type="button"
                      disabled={h.busy}
                      onClick={() => h.setStep(i)}
                      className="text-teal-800 underline"
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(fields[i] ?? []).map((f) => (
                      <div key={f.key}>
                        <dt className="text-sm text-muted-foreground">{f.label}</dt>
                        <dd className="break-words">{data[i]?.[f.key] || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                  {(i === 2 || i === 4) &&
                    documents
                      .filter((d) =>
                        i === 2
                          ? !["logo", "banner"].includes(d.kind)
                          : ["logo", "banner"].includes(d.kind),
                      )
                      .map((d) => (
                        <p className="mt-2 break-all" key={d.kind}>
                          {d.kind.replaceAll("_", " ")}: {d.name}
                        </p>
                      ))}
                </section>
              ))}
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  required
                  disabled={h.busy}
                />
                I confirm that this information is accurate and that I am authorized to represent
                this business.
              </label>
              <details className="rounded border p-4">
                <summary className="cursor-pointer font-semibold">
                  Seller Terms · version 2026-10-06
                </summary>
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    You must provide accurate business, identity, and payment details and keep them
                    up to date. You authorize Dukapambe to use your submitted information and
                    documents to verify your seller application.
                  </p>
                  <p>
                    You are responsible for lawful products, truthful listings, fulfillment,
                    customer support, taxes, and compliance with applicable laws. Approval is
                    required before seller tools become available. Dukapambe may request further
                    information or restrict an account for violations. Acceptance does not guarantee
                    approval.
                  </p>
                  <p>
                    Private identity and business documents are used for verification and account
                    support. Contact Dukapambe support for correction or deletion requests.
                  </p>
                </div>
              </details>
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  required
                  disabled={h.busy}
                />
                I accept the Seller Terms shown above.
              </label>
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              className="rounded border px-4 py-2"
              disabled={h.busy || step === 0}
              onClick={() => void go(step - 1)}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded border px-4 py-2"
              disabled={h.busy}
              onClick={() =>
                void (step < 5 ? h.persist(step) : Promise.resolve())
                  .then(() => router.navigate({ href: "/" }))
                  .catch((e) => h.setError(friendlyError(e)))
              }
            >
              Save & resume later
            </button>
            <button
              type="submit"
              className={sellerButton}
              disabled={h.busy || (step === 5 && (!confirmed || !terms))}
            >
              {h.busy ? "Saving…" : step === 5 ? "Submit application" : "Save & continue"}
            </button>
          </div>
        </form>
      )}
    </SellerLayout>
  );
}
