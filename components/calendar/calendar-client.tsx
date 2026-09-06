"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewEventDialog } from "./new-event-dialog";
import { EventDetailDialog } from "./event-detail-dialog";
import { moveCalendarEvent } from "@/actions/calendar-events";
import { EVENT_TYPE_LABEL, EVENT_TYPE_COLOR, type CalendarEventWithProject } from "./event-meta";
import { cn } from "@/lib/utils";

type View = "month" | "week" | "day";
type ProjectOption = { id: string; name: string; client: { name: string } };

const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const VIEW_OPTIONS: [View, string][] = [
  ["month", "חודש"],
  ["week", "שבוע"],
  ["day", "יום"],
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  return addDays(x, -x.getDay());
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function dayIsoAtNoon(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).toISOString();
}

// ---------- Presentational pieces (module scope — never redeclared on render) ----------

function EventPill({
  event,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  event: CalendarEventWithProject;
  onSelect: (event: CalendarEventWithProject) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", event.id);
        onDragStart(event.id);
      }}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(event);
      }}
      className={cn(
        "w-full truncate rounded border px-1.5 py-0.5 text-start text-[11px] font-medium leading-tight cursor-grab active:cursor-grabbing",
        EVENT_TYPE_COLOR[event.type]
      )}
      title={`${event.title}${event.project ? " · " + event.project.name : ""}`}
    >
      {event.title}
    </button>
  );
}

function DayCell({
  day,
  muted,
  events,
  projects,
  isDragOver,
  onDragOverDay,
  onDragLeaveDay,
  onDropDay,
  onSelectEvent,
  onDragStartEvent,
  onDragEndEvent,
}: {
  day: Date;
  muted?: boolean;
  events: CalendarEventWithProject[];
  projects: ProjectOption[];
  isDragOver: boolean;
  onDragOverDay: (day: Date) => void;
  onDragLeaveDay: () => void;
  onDropDay: (day: Date) => void;
  onSelectEvent: (event: CalendarEventWithProject) => void;
  onDragStartEvent: (id: string) => void;
  onDragEndEvent: () => void;
}) {
  const isToday = isSameDay(day, startOfDay(new Date()));

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverDay(day);
      }}
      onDragLeave={onDragLeaveDay}
      onDrop={(e) => {
        e.preventDefault();
        onDropDay(day);
      }}
      className={cn(
        "group flex min-h-[104px] flex-col gap-1 border-b border-e border-border p-1.5 last:border-e-0",
        muted && "bg-surface-muted/40",
        isDragOver && "bg-accent-soft/60"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-xs font-medium",
            isToday
              ? "bg-accent text-accent-foreground"
              : muted
              ? "text-muted-foreground"
              : "text-foreground"
          )}
        >
          {day.getDate()}
        </span>
        <NewEventDialog
          projects={projects}
          defaultDate={day}
          trigger={
            <button
              type="button"
              className="hidden size-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-surface-muted hover:text-foreground group-hover:flex group-hover:opacity-100"
            >
              <Plus className="size-3.5" />
            </button>
          }
        />
      </div>
      <div className="flex flex-col gap-1">
        {events.map((e) => (
          <EventPill
            key={e.id}
            event={e}
            onSelect={onSelectEvent}
            onDragStart={onDragStartEvent}
            onDragEnd={onDragEndEvent}
          />
        ))}
      </div>
    </div>
  );
}

type GridHandlers = {
  eventsOn: (day: Date) => CalendarEventWithProject[];
  projects: ProjectOption[];
  dragOverDay: string | null;
  onDragOverDay: (day: Date) => void;
  onDragLeaveDay: () => void;
  onDropDay: (day: Date) => void;
  onSelectEvent: (event: CalendarEventWithProject) => void;
  onDragStartEvent: (id: string) => void;
  onDragEndEvent: () => void;
};

function MonthGrid({ current, ...handlers }: { current: Date } & GridHandlers) {
  const monthStart = startOfMonth(current);
  const gridStart = startOfWeek(monthStart);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-surface-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-e border-border p-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground last:border-e-0"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            muted={day.getMonth() !== current.getMonth()}
            events={handlers.eventsOn(day)}
            projects={handlers.projects}
            isDragOver={handlers.dragOverDay === day.toDateString()}
            onDragOverDay={handlers.onDragOverDay}
            onDragLeaveDay={handlers.onDragLeaveDay}
            onDropDay={handlers.onDropDay}
            onSelectEvent={handlers.onSelectEvent}
            onDragStartEvent={handlers.onDragStartEvent}
            onDragEndEvent={handlers.onDragEndEvent}
          />
        ))}
      </div>
    </div>
  );
}

function WeekGrid({ current, ...handlers }: { current: Date } & GridHandlers) {
  const start = startOfWeek(current);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-surface-muted">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="border-e border-border p-2 text-center last:border-e-0"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {WEEKDAY_LABELS[day.getDay()]}
            </p>
            <p
              className={cn(
                "mt-0.5 text-sm font-medium",
                isSameDay(day, startOfDay(new Date())) ? "text-accent" : "text-foreground"
              )}
            >
              {day.getDate()}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            events={handlers.eventsOn(day)}
            projects={handlers.projects}
            isDragOver={handlers.dragOverDay === day.toDateString()}
            onDragOverDay={handlers.onDragOverDay}
            onDragLeaveDay={handlers.onDragLeaveDay}
            onDropDay={handlers.onDropDay}
            onSelectEvent={handlers.onSelectEvent}
            onDragStartEvent={handlers.onDragStartEvent}
            onDragEndEvent={handlers.onDragEndEvent}
          />
        ))}
      </div>
    </div>
  );
}

function DayList({
  current,
  eventsOn,
  onSelectEvent,
}: {
  current: Date;
  eventsOn: (day: Date) => CalendarEventWithProject[];
  onSelectEvent: (event: CalendarEventWithProject) => void;
}) {
  const dayEvents = eventsOn(current);

  return (
    <div className="rounded-lg border border-border">
      {dayEvents.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          אין אירועים ביום זה.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {dayEvents.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onSelectEvent(e)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start hover:bg-surface-muted/50"
            >
              <div>
                <p className="font-medium text-foreground">{e.title}</p>
                {e.project && (
                  <p className="text-sm text-muted-foreground">
                    {e.project.name} · {e.project.client.name}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  EVENT_TYPE_COLOR[e.type]
                )}
              >
                {EVENT_TYPE_LABEL[e.type]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Main orchestrator ----------

export function CalendarClient({
  events,
  projects,
}: {
  events: CalendarEventWithProject[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [current, setCurrent] = useState(() => startOfDay(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithProject | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  function eventsOn(day: Date) {
    return events
      .filter((e) => isSameDay(new Date(e.startAt), day))
      .sort((a, b) => a.title.localeCompare(b.title, "he"));
  }

  async function handleDrop(day: Date) {
    setDragOverDay(null);
    if (!dragId) return;
    const id = dragId;
    setDragId(null);
    await moveCalendarEvent(id, dayIsoAtNoon(day));
    router.refresh();
  }

  function goPrev() {
    if (view === "month") setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else if (view === "week") setCurrent((d) => addDays(d, -7));
    else setCurrent((d) => addDays(d, -1));
  }
  function goNext() {
    if (view === "month") setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else if (view === "week") setCurrent((d) => addDays(d, 7));
    else setCurrent((d) => addDays(d, 1));
  }
  function goToday() {
    setCurrent(startOfDay(new Date()));
  }

  const headerLabel = useMemo(() => {
    if (view === "month") {
      return new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(current);
    }
    if (view === "week") {
      const start = startOfWeek(current);
      const end = addDays(start, 6);
      return `${new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(
        start
      )} – ${new Intl.DateTimeFormat("he-IL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(end)}`;
    }
    return new Intl.DateTimeFormat("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(current);
  }, [view, current]);

  const gridHandlers: GridHandlers = {
    eventsOn,
    projects,
    dragOverDay,
    onDragOverDay: (day) => setDragOverDay(day.toDateString()),
    onDragLeaveDay: () => setDragOverDay(null),
    onDropDay: handleDrop,
    onSelectEvent: setSelectedEvent,
    onDragStartEvent: setDragId,
    onDragEndEvent: () => setDragId(null),
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev} aria-label="הקודם">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            היום
          </Button>
          <Button variant="outline" size="icon" onClick={goNext} aria-label="הבא">
            <ChevronLeft className="size-4" />
          </Button>
          <p className="ms-2 font-display text-lg text-foreground">{headerLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-surface-muted p-1">
            {VIEW_OPTIONS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  view === v
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <NewEventDialog projects={projects} defaultDate={current} />
        </div>
      </div>

      {view === "month" && <MonthGrid current={current} {...gridHandlers} />}
      {view === "week" && <WeekGrid current={current} {...gridHandlers} />}
      {view === "day" && (
        <DayList current={current} eventsOn={eventsOn} onSelectEvent={setSelectedEvent} />
      )}

      <EventDetailDialog
        event={selectedEvent}
        projects={projects}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
