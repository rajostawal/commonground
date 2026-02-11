"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { type Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/hooks/useToast";
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as Id<"events">;

  const event = useQuery(api.events.getById, { eventId });
  const deleteEvent = useMutation(api.events.deleteEvent);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEvent({ eventId });
      toast({ title: "Event deleted", variant: "default" });
      router.push("/calendar");
    } catch {
      toast({ title: "Failed to delete", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  if (event === undefined) return <div className="p-4"><Skeleton className="h-8 w-48" /></div>;
  if (!event) return <div className="p-4 text-[var(--color-text-muted)]">Event not found.</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <Link href="/calendar">
            <Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Event</h1>
        </div>
        <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setShowDelete(true)}>
          <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
        </Button>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto w-full space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{event.title}</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {format(new Date(event.startDate), "MMMM d, yyyy")}
          </p>
        </div>
        <Badge variant="default">{event.type}</Badge>
        {event.description && (
          <div>
            <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Notes</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{event.description}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete event?"
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
