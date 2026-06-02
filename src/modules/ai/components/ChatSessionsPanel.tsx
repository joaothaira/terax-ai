import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Add01Icon,
  BubbleChatIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SessionMeta } from "../lib/sessions";
import { useChatStore } from "../store/chatStore";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ChatSessionsPanel() {
  const sessions = useChatStore((s) => s.sessions);
  const activeId = useChatStore((s) => s.activeSessionId);
  const switchSession = useChatStore((s) => s.switchSession);
  const newSession = useChatStore((s) => s.newSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const renameSession = useChatStore((s) => s.renameSession);
  const openMini = useChatStore((s) => s.openMini);

  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt),
    [sessions],
  );

  const openSession = (id: string) => {
    switchSession(id);
    openMini();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-8 shrink-0 items-center gap-1 border-b border-border/60 px-2">
        <span className="flex flex-1 items-center gap-1.5 truncate pl-1 text-xs font-medium text-foreground/80">
          <HugeiconsIcon icon={BubbleChatIcon} size={14} strokeWidth={1.75} />
          Chats
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-foreground"
          onClick={() => {
            newSession();
            openMini();
          }}
          title="New chat"
          aria-label="New chat"
        >
          <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={2} />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {sorted.length === 0 ? (
          <div className="px-3 py-4 text-[11px] text-muted-foreground">
            No chats yet.
          </div>
        ) : (
          <ul className="flex flex-col">
            {sorted.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                active={s.id === activeId}
                editing={editingId === s.id}
                onOpen={() => openSession(s.id)}
                onBeginRename={() => setEditingId(s.id)}
                onCommitRename={(title) => {
                  const next = title.trim();
                  if (next) renameSession(s.id, next);
                  setEditingId(null);
                }}
                onCancelRename={() => setEditingId(null)}
                onDelete={() => deleteSession(s.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SessionRow({
  session,
  active,
  editing,
  onOpen,
  onBeginRename,
  onCommitRename,
  onCancelRename,
  onDelete,
}: {
  session: SessionMeta;
  active: boolean;
  editing: boolean;
  onOpen: () => void;
  onBeginRename: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onBeginRename();
        }}
        className={cn(
          "group flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left outline-none",
          "transition-colors focus-visible:bg-foreground/[0.045]",
          active
            ? "bg-foreground/[0.07] dark:bg-foreground/[0.09]"
            : "hover:bg-foreground/[0.045]",
        )}
      >
        <HugeiconsIcon
          icon={BubbleChatIcon}
          size={13}
          strokeWidth={1.75}
          className={cn(
            "shrink-0",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        />
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              defaultValue={session.title || "New chat"}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => onCommitRename(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") onCommitRename(e.currentTarget.value);
                else if (e.key === "Escape") onCancelRename();
              }}
              className="w-full rounded-sm border border-border/70 bg-background px-1 py-0.5 text-[12px] text-foreground outline-none focus:border-primary/50"
            />
          ) : (
            <>
              <div
                className={cn(
                  "truncate text-[12px]",
                  active ? "font-medium text-foreground" : "text-foreground/90",
                )}
              >
                {session.title || "New chat"}
              </div>
              <div className="truncate text-[10px] text-muted-foreground">
                {relativeTime(session.updatedAt)}
              </div>
            </>
          )}
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete chat"
            aria-label="Delete chat"
            className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
          >
            <HugeiconsIcon icon={Delete02Icon} size={12} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    </li>
  );
}
