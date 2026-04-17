"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  Edit,
  Trash2,
  Code,
  MessageSquare,
  Clock,
  Award,
  HelpCircle,
} from "lucide-react";

// Sample data (in real app, this would come from an API)
const assessmentQuestions: Array<{
  id: number;
  type: "coding" | "mcq" | "text";
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
}> = [
  {
    id: 1,
    type: "coding",
    title: "Implement a debounce function",
    difficulty: "Medium",
    points: 30,
  },
  {
    id: 2,
    type: "coding",
    title: "Binary Tree Traversal",
    difficulty: "Hard",
    points: 40,
  },
  {
    id: 3,
    type: "mcq",
    title: "React Hooks",
    difficulty: "Easy",
    points: 10,
  },
  {
    id: 4,
    type: "text",
    title: "System Design",
    difficulty: "Hard",
    points: 20,
  },
];

const interviewQuestions: Array<{
  id: number;
  type: "oral" | "coding";
  question: string;
  duration: number;
}> = [
  {
    id: 1,
    type: "oral",
    question: "Tell me about yourself",
    duration: 120,
  },
  {
    id: 2,
    type: "coding",
    question: "Find longest palindrome",
    duration: 900,
  },
  {
    id: 3,
    type: "oral",
    question: "Explain closures in JavaScript",
    duration: 180,
  },
];

// Difficulty badge colors
const difficultyColors = {
  Easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0",
  Medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  Hard: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-0",
};

// Type badge colors for assessment
const typeColors = {
  coding:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0",
  mcq: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0",
  text: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300 border-0",
  oral: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
};

export default function QuestionsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [questionType, setQuestionType] = useState<"assessment" | "interview">(
    "assessment"
  );
  const [formData, setFormData] = useState({
    type: "coding",
    title: "",
    description: "",
    difficulty: "",
    points: "",
    duration: "",
    options: "",
    starterCode: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDialog(false);
    setFormData({
      type: "coding",
      title: "",
      description: "",
      difficulty: "",
      points: "",
      duration: "",
      options: "",
      starterCode: "",
    });
  };

  return (
    <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white flex items-center gap-2">
              Question Bank
              
            </h1>
            <p className="text-[#5A534A] dark:text-slate-400 mt-2">
              Manage assessment and interview questions
            </p>
          </div>
        </div>

        <Tabs defaultValue="assessment" className="space-y-6">
          <TabsList className="border border-[#D6CDC2] bg-white/70 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
            <TabsTrigger
              value="assessment"
              className="data-[state=active]:bg-[#F1E9E0] data-[state=active]:text-[#2D2A24] dark:data-[state=active]:bg-slate-800"
            >
              Assessment Questions
            </TabsTrigger>
            <TabsTrigger
              value="interview"
              className="data-[state=active]:bg-[#F1E9E0] data-[state=active]:text-[#2D2A24] dark:data-[state=active]:bg-slate-800"
            >
              Interview Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assessment" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setQuestionType("assessment");
                  setShowDialog(true);
                }}
                className="bg-[#B8915C] text-white shadow-lg transition-all duration-300 hover:bg-[#9F7A4F] hover:shadow-xl"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-3">
              {assessmentQuestions.map((q) => (
                <Card
                  key={q.id}
                  className="border-none bg-white/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:bg-slate-900/70"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={typeColors[q.type]}>
                            {q.type === "coding" && (
                              <Code className="h-3 w-3 mr-1" />
                            )}
                            {q.type === "mcq" && (
                              <HelpCircle className="h-3 w-3 mr-1" />
                            )}
                            {q.type === "text" && (
                              <MessageSquare className="h-3 w-3 mr-1" />
                            )}
                            {q.type.toUpperCase()}
                          </Badge>
                          <Badge className={difficultyColors[q.difficulty]}>
                            {q.difficulty}
                          </Badge>
                          <Badge variant="outline" className="border-[#D6CDC2] dark:border-slate-700">
                            <Award className="h-3 w-3 mr-1 text-amber-500" />
                            {q.points} pts
                          </Badge>
                        </div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {q.title}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#5A534A] hover:text-[#B8915C] dark:text-slate-400 dark:hover:text-[#B8915C]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="interview" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setQuestionType("interview");
                  setShowDialog(true);
                }}
                className="bg-[#B8915C] text-white shadow-lg transition-all duration-300 hover:bg-[#9F7A4F] hover:shadow-xl"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-3">
              {interviewQuestions.map((q) => (
                <Card
                  key={q.id}
                  className="border-none bg-white/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:bg-slate-900/70"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={typeColors[q.type]}>
                            {q.type === "oral" ? (
                              <MessageSquare className="h-3 w-3 mr-1" />
                            ) : (
                              <Code className="h-3 w-3 mr-1" />
                            )}
                            {q.type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="border-[#D6CDC2] dark:border-slate-700">
                            <Clock className="h-3 w-3 mr-1 text-amber-500" />
                            {Math.floor(q.duration / 60)} min
                          </Badge>
                        </div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {q.question}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#5A534A] hover:text-[#B8915C] dark:text-slate-400 dark:hover:text-[#B8915C]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Question Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-none bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-[#2D2A24] dark:text-white">
                Add {questionType === "assessment" ? "Assessment" : "Interview"} Question
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-[#4A443C] dark:text-slate-300">
                  Question Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger
                    id="type"
                    className="border-[#D6CDC2] bg-white dark:border-slate-700 dark:bg-slate-800"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="text">Text Answer</SelectItem>
                    {questionType === "interview" && (
                      <SelectItem value="oral">Oral</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-[#4A443C] dark:text-slate-300">
                  {questionType === "assessment" ? "Title" : "Question"}
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={
                    questionType === "assessment"
                      ? "e.g., Implement a debounce function"
                      : "e.g., Explain closures in JavaScript"
                  }
                  required
                  className="border-[#D6CDC2] bg-white dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[#4A443C] dark:text-slate-300">
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide additional context or instructions..."
                  rows={3}
                  className="border-[#D6CDC2] bg-white dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {questionType === "assessment" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-[#4A443C] dark:text-slate-300">
                      Difficulty
                    </Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) =>
                        setFormData({ ...formData, difficulty: value })
                      }
                    >
                      <SelectTrigger
                        id="difficulty"
                        className="border-[#D6CDC2] bg-white dark:border-slate-700 dark:bg-slate-800"
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points" className="text-[#4A443C] dark:text-slate-300">
                      Points
                    </Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                      placeholder="e.g., 30"
                      className="border-[#D6CDC2] bg-white dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {questionType === "interview" && (
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-[#4A443C] dark:text-slate-300">
                    Duration (seconds)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 120"
                    className="border-[#D6CDC2] bg-white dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              )}

              {formData.type === "mcq" && (
                <div className="space-y-2">
                  <Label htmlFor="options" className="text-[#4A443C] dark:text-slate-300">
                    Options (comma-separated)
                  </Label>
                  <Input
                    id="options"
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    placeholder="Option 1, Option 2, Option 3, Option 4"
                    className="border-[#D6CDC2] bg-white dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              )}

              {formData.type === "coding" && (
                <div className="space-y-2">
                  <Label htmlFor="starterCode" className="text-[#4A443C] dark:text-slate-300">
                    Starter Code (optional)
                  </Label>
                  <Textarea
                    id="starterCode"
                    value={formData.starterCode}
                    onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                    placeholder="function example() {&#10;  // Your code here&#10;}"
                    rows={5}
                    className="border-[#D6CDC2] bg-white font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-[#B8915C] text-white shadow-lg hover:bg-[#9F7A4F]"
                >
                  Add Question
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-[#D6CDC2] hover:bg-[#F1E9E0] dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
