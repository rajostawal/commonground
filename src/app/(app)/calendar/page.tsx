"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import Link from "next/link";
import { Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/money/formatters";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";

const EVENT_COLORS = {
  guest: "bg-blue-500/20 text-blue-400",
  party: "bg-purple-500/20 text-purple-400",
  quiet: "bg-green-500/20 text-green-400",
  maintenance: "bg-orange-500/20 text-orange-400",
  other: "bg-[var(--color-bg-surface-3)] text-[var(--color-text-muted)]",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const household = useQuery(api.households.getMyHousehold);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const events = useQuery(
    api.events.listByHouseholdByMonth,
    household
      ? {
          householdId: household._id,
          startTimestamp: monthStart.getTime(),
          endTimestamp: monthEnd.getTime(),
        }
      : "skip"
  );

  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedDayEvents = (events ?? []).filter((e) =>
    isSameDay(new Date(e.startDate), selectedDate)
  );

  const datesWithEvents = new Set(
    (events ?? []).map((e) => format(new Date(e.startDate), "yyyy-MM-dd"))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Calendar</h1>
        <Link href="/calendar/add">
          <Button variant="primary" size="sm"><Plus className="h-4 w-4" />Add</Button>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-4 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-center text-xs text-[var(--color-text-muted)] py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-4 gap-0.5">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const hasEvents = datesWithEvents.has(dateKey);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative flex flex-col items-center py-1.5 rounded-md transition-colors",
                  isSelected
                    ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                    : "hover:bg-[var(--color-bg-surface-2)]",
                  !isCurrentMonth && "opacity-30"
                )}
              >
                <span
                  className={cn(
                    "text-sm w-7 h-7 flex items-center justify-center rounded-full",
                    isToday && !isSelected && "border border-[var(--color-accent)]",
                    isSelected && "font-semibold"
                  )}
                >
                  {format(day, "d")}
                </span>
                {hasEvents && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--color-accent)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Day event list */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
            {format(selectedDate, "MMMM d, yyyy")}
          </h3>

          {events === undefined ? (
            <SkeletonList count={2} />
          ) : selectedDayEvents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-[var(--color-text-muted)]">No events on this day.</p>
              <Link href="/calendar/add" className="mt-2 inline-block">
                <Button variant="ghost" size="sm" className="text-xs">Add event</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((event) => (
                <Link key={event._id} href={`/calendar/${event._id}`}>
                  <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3 hover:border-[var(--color-border-default)] transition-colors">
                    <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", EVENT_COLORS[event.type])}>
                      {event.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-[var(--color-text-muted)] truncate">{event.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
