"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/hooks/useToast";
import { Copy, Check, LogOut } from "lucide-react";

export default function MembersPage() {
  const { user } = useUser();
  const router = useRouter();
  const household = useQuery(api.households.getMyHousehold);
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const leaveHousehold = useMutation(api.households.leaveHousehold);

  const [copied, setCopied] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function copyInviteCode() {
    if (!household) return;
    await navigator.clipboard.writeText(household.inviteCode);
    setCopied(true);
    toast({ title: "Invite code copied!", variant: "success" });
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    if (!household) return;
    setLeaving(true);
    try {
      await leaveHousehold({ householdId: household._id });
      toast({ title: "Left household", variant: "default" });
      router.replace("/onboarding");
    } catch (err) {
      toast({ title: (err as Error).message ?? "Failed to leave", variant: "error" });
    } finally {
      setLeaving(false);
      setShowLeave(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Members</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Invite code card */}
        {household && (
          <Card>
            <CardHeader><CardTitle>Invite Code</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-bold tracking-[0.2em] text-[var(--color-text-primary)] bg-[var(--color-bg-surface-2)] px-4 py-2 rounded-md flex-1 text-center">
                  {household.inviteCode}
                </span>
                <Button variant="secondary" size="md" onClick={copyInviteCode} aria-label="Copy invite code">
                  {copied ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Share this code to invite people to {household.name}.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Members list */}
        <div>
          <h2 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            {members?.length ?? 0} members
          </h2>
          {members === undefined ? (
            <SkeletonList count={3} />
          ) : (
            <div className="space-y-2">
              {members.map(({ membership, user: memberUser }) => (
                <div
                  key={membership._id}
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3"
                >
                  <Avatar
                    fallback={memberUser?.name ?? "?"}
                    src={memberUser?.imageUrl ?? undefined}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {memberUser?.name ?? "Unknown"}
                      {membership.userId === user?.id && (
                        <span className="ml-1.5 text-[var(--color-text-muted)] font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{memberUser?.email ?? ""}</p>
                  </div>
                  <Badge variant={membership.role === "owner" ? "accent" : "default"}>
                    {membership.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave button */}
        <Button
          variant="destructive"
          size="md"
          className="w-full mt-4"
          onClick={() => setShowLeave(true)}
        >
          <LogOut className="h-4 w-4" />
          Leave household
        </Button>
      </div>

      <ConfirmDialog
        open={showLeave}
        onOpenChange={setShowLeave}
        title="Leave household?"
        description="You will lose access to all household data. You can rejoin with the invite code."
        confirmLabel="Leave"
        destructive
        loading={leaving}
        onConfirm={handleLeave}
      />
    </div>
  );
}
