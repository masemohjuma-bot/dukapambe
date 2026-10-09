import { useState } from "react";
import type { DocumentRecord } from "@/lib/seller/model";
import {
  deleteDocument,
  friendlyError,
  previewDocument,
  uploadDocument,
} from "@/lib/seller/service";
export function DocumentUpload({
  kind,
  label,
  document,
  disabled,
  onChange,
  onError,
  runOperation,
}: {
  kind: string;
  label: string;
  document: DocumentRecord | undefined;
  disabled: boolean;
  onChange: () => Promise<unknown>;
  onError: (message: string) => void;
  runOperation: (fn: () => Promise<unknown>) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const imageOnly = kind === "logo" || kind === "banner";
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    onError("");
    try {
      await runOperation(async () => {
        try {
          await fn();
        } finally {
          await onChange();
        }
      });
    } catch (e) {
      onError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-lg border p-4">
      <label className="block font-semibold" htmlFor={`upload-${kind}`}>
        {label}
      </label>
      <p className="my-1 text-sm text-muted-foreground">
        {imageOnly ? "PNG or JPEG" : "PDF, PNG or JPEG"} · up to {kind === "logo" ? "5" : "10"} MB
      </p>
      <input
        id={`upload-${kind}`}
        type="file"
        accept={imageOnly ? ".png,.jpg,.jpeg" : ".pdf,.png,.jpg,.jpeg"}
        disabled={disabled || busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file)
            void action(async () => {
              setPreview(null);
              await uploadDocument(kind, file, document);
            });
        }}
        className="mt-2 block w-full text-sm"
      />
      {busy && <p role="status">Saving file…</p>}
      {document && (
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <span className="break-all">{document.name}</span>
          <button
            type="button"
            disabled={busy || disabled}
            onClick={() => void action(async () => setPreview(await previewDocument(document)))}
            className="text-teal-800 underline"
          >
            Preview
          </button>
          <button
            type="button"
            disabled={busy || disabled}
            onClick={() => {
              if (window.confirm("Delete this uploaded file?"))
                void action(async () => {
                  setPreview(null);
                  await deleteDocument(document);
                });
            }}
            className="text-destructive underline"
          >
            Delete
          </button>
        </div>
      )}
      {preview && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Private preview expires after 60 seconds.</p>
          {document?.mime === "application/pdf" ? (
            <iframe
              title={`${label} preview`}
              src={preview}
              className="h-80 w-full rounded border"
            />
          ) : (
            <img src={preview} alt={`${label} preview`} className="max-h-80 max-w-full rounded" />
          )}
          <button type="button" onClick={() => setPreview(null)} className="mt-2 underline">
            Close preview
          </button>
        </div>
      )}
    </div>
  );
}
