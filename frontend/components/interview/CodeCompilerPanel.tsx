"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Copy, DownloadCloud } from "lucide-react";
import { executeCode, SUPPORTED_LANGUAGES, ExecutionResult } from "@/services/codeExecutor";

interface CodeCompilerPanelProps {
  problem?: {
    title: string;
    description: string;
    language: string;
    starterCode: string;
  };
  onCodeSubmit?: (code: string, language: string) => void;
  sessionId: string;
}

export default function CodeCompilerPanel({
  problem,
  onCodeSubmit,
  sessionId,
}: CodeCompilerPanelProps) {
  const [code, setCode] = useState(problem?.starterCode || "");
  const [language, setLanguage] = useState(problem?.language || "javascript");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  // Reset code when problem changes
  useEffect(() => {
    if (problem) {
      setCode(problem.starterCode || "");
      setLanguage(problem.language || "javascript");
      setOutput("");
      setResult(null);
    }
  }, [problem]);

  const handleRunCode = async () => {
    if (!code.trim()) {
      setOutput("Please write some code first...");
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const executionResult = await executeCode(code, language, sessionId);
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      setResult(executionResult);

      if (executionResult.status === "success") {
        setOutput(executionResult.output || "(No output)");
      } else {
        setOutput(`Error: ${executionResult.error || "Execution failed"}`);
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = () => {
    if (onCodeSubmit) {
      onCodeSubmit(code, language);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([code], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `solution.${getFileExtension(language)}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: "js",
      python3: "py",
      java: "java",
      cpp14: "cpp",
      csharp: "cs",
    };
    return extensions[lang] || "txt";
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Problem Statement */}
      {problem && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{problem.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            <p className="whitespace-pre-wrap">{problem.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Editor Section */}
      <Card className="flex-[7] flex flex-col min-h-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Code Editor</CardTitle>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="p-1 hover:bg-slate-100 rounded"
                title="Copy code"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={handleDownloadCode}
                className="p-1 hover:bg-slate-100 rounded"
                title="Download code"
              >
                <DownloadCloud className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 p-4 font-mono text-sm border-none resize-none focus:outline-none bg-slate-900 text-slate-50"
            placeholder="// Write your code here..."
            spellCheck="false"
          />
        </CardContent>
      </Card>

      {/* Execution Output */}
      <Card className="flex-[3] flex flex-col min-h-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Output</CardTitle>
          {executionTime > 0 && (
            <p className="text-xs text-slate-600">
              Executed in {executionTime}ms
              {result?.cpuTime && ` (CPU: ${result.cpuTime})`}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <pre className="flex-1 p-4 bg-slate-900 text-slate-50 text-xs overflow-auto font-mono">
            {output || "(Run code to see output)"}
          </pre>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleRunCode}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          <Play className="h-4 w-4 mr-2" />
          {loading ? "Running..." : "Run Code"}
        </Button>
        <Button
          onClick={handleSubmitCode}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Submit Solution
        </Button>
      </div>
    </div>
  );
}
