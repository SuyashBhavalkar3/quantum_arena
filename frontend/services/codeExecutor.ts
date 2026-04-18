// Code Executor Service - Integrates with JDoodle API (via backend)

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface ExecutionResult {
  output: string;
  error?: string;
  cpuTime?: string;
  memory?: string;
  status: "success" | "error" | "timeout";
}

export interface CodeSubmission {
  code: string;
  language: string;
  sessionId: string;
}

export const executeCode = async (
  code: string,
  language: string,
  sessionId: string
): Promise<ExecutionResult> => {
  try {
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.id === language);
    
    const payload = {
      code,
      language,
      sessionId,
      versionIndex: "3",
    };
    
    
    const response = await fetch(`${BACKEND_API}/api/execute-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Backend error ${response.status}:`, errorData);
      
      return {
        output: "",
        error: `Execution failed: ${response.status} - ${errorData}`,
        status: "error",
      };
    }

    const data = await response.json();

    return {
      output: data.output || "",
      error: data.error || undefined,
      cpuTime: data.cpuTime,
      memory: data.memory,
      status: data.error ? "error" : "success",
    };
  } catch (error) {
    console.error("Code execution request error:", error);
    return {
      output: "",
      error: `Execution error: ${error instanceof Error ? error.message : "Unknown error"}`,
      status: "error",
    };
  }
};

export const SUPPORTED_LANGUAGES = [
  { id: "javascript", name: "JavaScript", version: 18 },
  { id: "python3", name: "Python 3", version: 3 },
  { id: "java", name: "Java", version: 14 },
  { id: "cpp14", name: "C++", version: 14 },
  { id: "csharp", name: "C#", version: 8 },
];

export const getLanguageId = (name: string): string => {
  const lang = SUPPORTED_LANGUAGES.find(
    (l) => l.name.toLowerCase() === name.toLowerCase()
  );
  return lang?.id || "javascript";
};
