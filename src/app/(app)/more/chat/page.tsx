"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/money/formatters";
import { Send, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { user } = useUser();
  const household = useQuery(api.households.getMyHousehold);
  const messages = useQuery(
    api.messages.listByHousehold,
    household ? { householdId: household._id, limit: 100 } : "skip"
  );
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const sendMessage = useMutation(api.messages.sendMessage);

  const [content, setContent] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const memberMap = Object.fromEntries(
    (members ?? []).map((m) => [
      m.membership.userId,
      { name: m.user?.name ?? "Unknown", imageUrl: m.user?.imageUrl },
    ])
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !household) return;

    setSending(true);
    try {
      await sendMessage({ householdId: household._id, content: content.trim(), isAnnouncement });
      setContent("");
      setIsAnnouncement(false);
    } catch {
      toast({ title: "Failed to send", variant: "error" });
    } finally {
      setSending(false);
    }
  }

  // Messages are returned newest-first, reverse for display
  const displayMessages = [...(messages ?? [])].reverse();
  const clerkId = user?.id ?? "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Chat</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages === undefined ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-3/4" style={{ marginLeft: i % 2 === 0 ? "auto" : "0" }} />)}
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">No messages yet. Say hi!</p>
          </div>
        ) : (
          displayMessages.map((msg) => {
            const isMe = msg.authorUserId === clerkId;
            const author = memberMap[msg.authorUserId];
            return (
              <div key={msg._id} className={cn("flex gap-2.5", isMe && "flex-row-reverse")}>
                {!isMe && (
                  <Avatar
                    fallback={author?.name ?? "?"}
                    src={author?.imageUrl}
                    size="sm"
                    className="shrink-0 mt-0.5"
                  />
                )}
                <div className={cn("flex flex-col gap-0.5 max-w-[75%]", isMe && "items-end")}>
                  {!isMe && (
                    <span className="text-xs text-[var(--color-text-muted)]">{author?.name ?? "Unknown"}</span>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm",
                      isMe
                        ? "bg-[var(--color-accent)] text-white rounded-tr-sm"
                        : "bg-[var(--color-bg-surface-2)] text-[var(--color-text-primary)] rounded-tl-sm",
                      msg.isAnnouncement && "border border-[var(--color-accent)]/50"
                    )}
                  >
                    {msg.isAnnouncement && (
                      <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                        <Megaphone className="h-3 w-3" />
                        Announcement
                      </div>
                    )}
                    <p>{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)]">{formatDate(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] px-4 py-3">
        <form onSubmit={handleSend} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Message..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(e as unknown as React.FormEvent)}
            />
            <Button type="submit" variant="primary" size="icon-md" loading={sending} disabled={!content.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setIsAnnouncement(!isAnnouncement)}
            className={cn(
              "flex items-center gap-1.5 text-xs self-start rounded px-2 py-1 transition-colors",
              isAnnouncement
                ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            )}
          >
            <Megaphone className="h-3 w-3" />
            Post as announcement
          </button>
        </form>
      </div>
    </div>
  );
}
