import React from "react";
import { FormQuestion } from "../../types";

export interface FormFillFieldsProps {
  questions: FormQuestion[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  onToggleCheckbox: (questionId: string, optionValue: number) => void;
}

// Renders the question list + answer inputs shared by "fill a new response" and
// "edit an existing response" flows — extracted from FormsModule.tsx so both the
// standalone Forms module and the patient-chart ficha tab render identically.
export const FormFillFields: React.FC<FormFillFieldsProps> = ({
  questions,
  answers,
  onAnswerChange,
  onToggleCheckbox,
}) => {
  return (
    <div className="space-y-6">
      {questions.map((q, idx) => {
        const previousSection = idx > 0 ? questions[idx - 1].section : undefined;
        const showSectionHeader = q.section && q.section !== previousSection;

        return (
          <React.Fragment key={q.id}>
            {showSectionHeader && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#1070ca]">{q.section}</span>
                <div className="h-px flex-1 bg-[#1070ca]/15" />
              </div>
            )}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <p className="text-sm font-bold text-slate-800">
                {idx + 1}. {q.text} {q.required && <span className="text-red-500">*</span>}
              </p>

              {q.type === "text" && (
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                />
              )}

              {q.type === "textarea" && (
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm resize-none"
                  rows={3}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                />
              )}

              {q.type === "number" && (
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => onAnswerChange(q.id, e.target.value === "" ? "" : Number(e.target.value))}
                />
              )}

              {(q.type === "radio" || q.type === "select") && (
                <div className="flex flex-col gap-2">
                  {(q.options ?? []).map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === opt.value}
                        onChange={() => onAnswerChange(q.id, opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              {q.type === "checkbox" && (
                <div className="flex flex-col gap-2">
                  {(q.options ?? []).map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt.value)}
                        onChange={() => onToggleCheckbox(q.id, opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}

      {questions.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">Este formulário ainda não possui perguntas.</p>
      )}
    </div>
  );
};
