"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useTranscriptUpload } from "@/lib/queries";

interface ParsedCourse {
  code: string;
  name: string;
  credits: number;
  grade: string;
}

export function TranscriptUpload({
  onCoursesExtracted,
}: {
  onCoursesExtracted: (courses: ParsedCourse[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useTranscriptUpload();

  const loading = mutation.isPending;
  const error = clientError ?? (mutation.error ? "Something went wrong while parsing your transcript. Please try again." : null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") {
        setClientError("Please upload a PDF file");
        return;
      }

      setClientError(null);
      mutation.mutate(file, {
        onSuccess: (courses) => {
          onCoursesExtracted(courses);
        },
      });
    },
    [onCoursesExtracted, mutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
        ${
          dragging
            ? "border-sift-amber bg-sift-amber/5"
            : "border-border hover:border-muted-foreground/40"
        }
        ${loading ? "pointer-events-none opacity-60" : ""}
      `}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {loading ? (
        <div className="space-y-3">
          <div className="w-8 h-8 border-2 border-sift-amber border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            Parsing transcript...
          </p>
          <p className="text-xs text-muted-foreground/60">
            This may take a few seconds
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-muted-foreground"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" x2="12" y1="18" y2="12" />
            <line x1="9" x2="15" y1="15" y2="15" />
          </svg>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop your transcript PDF here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Choose File
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sift-red text-xs mt-3">{error}</p>
      )}
    </div>
  );
}
