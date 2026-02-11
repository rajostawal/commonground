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
import { format } from "date-fns";

const EVENT_TYPES = [
  { value: "guest", label: "Guest" },
  { value: "party", label: "Party" },
  { value: "quiet", label: "Quiet hours" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

export default function AddEventPage() {
  const router = useRouter();
  const household = useQuery(api.households.getMyHousehold);
  const createEvent = useMutation(api.events.createEvent);

  const today = format(new Date(), "yyyy-MM-dd");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"guest" | "party" | "quiet" | "maintenance" | "other">("other");
  const [startDate, setStartDate] = useState(today);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = title.trim().length >= 1 && startDate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !household) return;

    setLoading(true);
    try {
      await createEvent({
        householdId: household._id,
        title: title.trim(),
        type,
        startDate: new Date(startDate).getTime(),
        description: description.trim() || undefined,
      });
      toast({ title: "Event added!", variant: "success" });
      router.push("/calendar");
    } catch (err) {
      toast({ title: (err as Error).message ?? "Failed", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/calendar">
          <Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Add Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-5 max-w-lg mx-auto">
          <FormField label="Event title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Guest staying over" autoFocus />
          </FormField>
          <FormField label="Type">
            <Select value={type} onValueChange={(v) => setType(v as typeof type)} options={EVENT_TYPES} />
          </FormField>
          <FormField label="Date" required>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={today} />
          </FormField>
          <FormField label="Notes">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details..." rows={3} />
          </FormField>
        </div>
        <div className="sticky bottom-0 px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)]">
          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!isValid} className="w-full">Add event</Button>
        </div>
      </form>
    </div>
  );
}
