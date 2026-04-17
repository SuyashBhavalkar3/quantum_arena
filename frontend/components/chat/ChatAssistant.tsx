"use client";

import { useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hrAPI } from "@/lib/api";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me to create a job, list active jobs, delete a job post, or list candidates for a role.",
    },
  ]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || loading) {
      return;
    }

    setMessages((current) => [...current, { role: "user", content: query }]);
    setInput("");
    setLoading(true);

    try {
      const response = await hrAPI.runAICommand(query);
      const detail =
        response.data && response.data.length > 0
          ? `\n${response.data
              .slice(0, 5)
              .map((item) => JSON.stringify(item))
              .join("\n")}`
          : "";

      setMessages((current) => [
        ...current,
        { role: "assistant", content: `${response.message}${detail}` },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "The assistant could not process that request.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[calc(100vw-2rem)] max-w-[380px] sm:bottom-6 sm:right-6">
      {open && (
        <Card className="mb-4 w-full overflow-hidden border-none bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
          <CardContent className="p-0">
            <div className="flex items-center justify-between rounded-t-2xl bg-[#2D2A24] px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#E7D7BE]" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">HR AI Assistant</p>
                  <p className="text-xs text-white/70">Natural-language HR actions</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-96 space-y-3 overflow-x-hidden overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? "ml-8 max-w-full overflow-hidden rounded-2xl bg-[#B8915C] px-4 py-3 text-sm text-white"
                      : "mr-8 max-w-full overflow-hidden rounded-2xl bg-[#F1E9E0] px-4 py-3 text-sm text-[#4A443C] dark:bg-slate-800 dark:text-slate-300"
                  }
                >
                  <pre className="whitespace-pre-wrap break-words font-sans [overflow-wrap:anywhere]">
                    {message.content}
                  </pre>
                </div>
              ))}

              {loading && (
                <div className="mr-8 max-w-full overflow-hidden rounded-2xl bg-[#F1E9E0] px-4 py-3 text-sm text-[#4A443C] dark:bg-slate-800 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#E5DDD2] p-4 dark:border-slate-800">
              <div className="flex items-end gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Add a job post for SDE1 with 5 years experience"
                  className="min-w-0 flex-1 border-[#D6CDC2] bg-white dark:bg-slate-800"
                />
                <Button
                  onClick={() => void handleSend()}
                  disabled={loading || input.trim().length === 0}
                  className="shrink-0 bg-[#B8915C] hover:bg-[#9F7A4F]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        size="icon"
        onClick={() => setOpen((current) => !current)}
        className="h-14 w-14 rounded-full bg-[#B8915C] shadow-xl hover:bg-[#9F7A4F]"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
    </div>
  );
}
