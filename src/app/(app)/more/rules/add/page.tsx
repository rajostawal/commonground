"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { toast } from "@/hooks/useToast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "cleaning", label: "Cleaning" },
  { value: "guests", label: "Guests" },
  { value: "noise", label: "Noise" },
  { value: "kitchen", label: "Kitchen" },
  { value: "finances", label: "Finances" },
  { value: "general", label: "General" },
];

const PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function AddRulePage() {
  const router = useRouter();
  const household = useQuery(api.households.getMyHousehold);
  const createRule = useMutation(api.rules.createRule);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [loading, setLoading] = useState(false);

  const isValid = title.trim().length >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !household) return;
    setLoading(true);
    try {
      await createRule({ householdId: household._id, title: title.trim(), description: description.trim() || undefined, category, priority });
      toast({ title: "Rule created!", variant: "success" });
      router.push("/more/rules");
    } catch (err) {
      toast({ title: (err as Error).message ?? "Failed", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/more/rules"><Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Add Rule</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-5 max-w-lg mx-auto">
          <FormField label="Rule" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. No loud music after 10pm" autoFocus />
          </FormField>
          <FormField label="Details">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional explanation..." rows={3} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <Select value={category} onValueChange={setCategory} options={CATEGORIES} />
            </FormField>
            <FormField label="Priority">
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)} options={PRIORITIES} />
            </FormField>
          </div>
        </div>
        <div className="sticky bottom-0 px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)]">
          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!isValid} className="w-full">Create rule</Button>
        </div>
      </form>
    </div>
  );
}
