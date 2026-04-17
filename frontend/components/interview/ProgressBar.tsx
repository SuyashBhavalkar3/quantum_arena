interface ProgressBarProps {
  currentIndex: number;
  totalQuestions: number;
}

export default function ProgressBar({ currentIndex, totalQuestions }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: totalQuestions }).map((_, index) => (
        <div
          key={index}
          className={`flex-1 h-2 rounded-full ${
            index < currentIndex
              ? "bg-green-500"
              : index === currentIndex
              ? "bg-blue-600"
              : "bg-slate-200 dark:bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}