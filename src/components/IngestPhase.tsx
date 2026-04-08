import { useState, useCallback } from "react";
import { FileUp, ArrowRight, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IngestPhaseProps {
  onAnalyze: (file: File) => void;
}

export function IngestPhase({ onAnalyze }: IngestPhaseProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Dropzone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            group flex flex-col items-center justify-center gap-4 p-16 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300
            ${
              file
                ? "border-success bg-success/5"
                : dragOver
                ? "border-primary bg-dropzone-bg-hover scale-[1.01]"
                : "border-dropzone-border bg-dropzone-bg hover:bg-dropzone-bg-hover hover:border-primary/70"
            }
          `}
        >
          {file ? (
            <>
              <FileCheck className="h-12 w-12 text-success" />
              <p className="text-lg font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                Click to replace or drop a new file
              </p>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-accent transition-transform duration-300 group-hover:scale-110">
                <FileUp className="h-10 w-10 text-accent-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xl font-semibold text-foreground">
                  Upload New Tender Document
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag & drop your PDF here, or click to browse
                </p>
              </div>
            </>
          )}
          <input
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>

        {/* Analyze Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!file}
            onClick={() => file && onAnalyze(file)}
            className="px-8 py-6 text-base font-semibold gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
          >
            Analyze & Draft
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
