"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/money/formatters";
import { ShoppingCart, Plus, Trash2, ChevronDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SubscriptionGate } from "@/components/features/SubscriptionGate";
import { useSubscription } from "@/hooks/useSubscription";
import type { Id } from "@/../convex/_generated/dataModel";

export default function ShoppingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const listId = params.id as Id<"shoppingLists">;
  const { isSubscribed, isLoading: subLoading } = useSubscription();

  const list = useQuery(api.shoppingLists.getById, { listId });
  const items = useQuery(api.shoppingItems.listByList, { listId });
  const household = useQuery(api.households.getMyHousehold);
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );

  const createItem = useMutation(api.shoppingItems.createItem);
  const toggleBought = useMutation(api.shoppingItems.toggleBought);
  const deleteItem = useMutation(api.shoppingItems.deleteItem);
  const deleteList = useMutation(api.shoppingLists.deleteList);

  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);
  const [boughtExpanded, setBoughtExpanded] = useState(false);

  const memberMap = Object.fromEntries(
    (members ?? []).map((m) => [
      m.membership.userId,
      { name: m.user?.name ?? "Unknown", imageUrl: m.user?.imageUrl },
    ])
  );

  const unboughtItems = items?.filter((i) => !i.boughtByUserId) ?? [];
  const boughtItems = items?.filter((i) => i.boughtByUserId) ?? [];

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setAdding(true);
    try {
      await createItem({ listId, name: newItemName.trim() });
      setNewItemName("");
    } catch {
      toast({ title: "Failed to add item", variant: "error" });
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(itemId: Id<"shoppingItems">) {
    try {
      await toggleBought({ itemId });
    } catch {
      toast({ title: "Failed to update item", variant: "error" });
    }
  }

  async function handleDelete(itemId: Id<"shoppingItems">) {
    try {
      await deleteItem({ itemId });
    } catch {
      toast({ title: "Failed to delete item", variant: "error" });
    }
  }

  async function handleDeleteList() {
    try {
      await deleteList({ listId });
      router.push("/shopping-list");
    } catch {
      toast({ title: "Failed to delete list", variant: "error" });
    }
  }

  if (!isSubscribed) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <Link href="/shopping-list">
            <Button variant="ghost" size="icon-sm" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Shopping List
          </h1>
        </div>
        <SubscriptionGate featureName="Multiple shopping lists" fullPage>
          <div />
        </SubscriptionGate>
      </div>
    );
  }

  if (list === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-[var(--color-text-muted)]">List not found</p>
        <Link href="/shopping-list">
          <Button variant="ghost" size="sm">Back to Shopping List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/shopping-list">
          <Button variant="ghost" size="icon-sm" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)] flex-1">
          {list?.name ?? "Loading..."}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteList}
          className="text-[var(--color-error)] text-xs"
        >
          Delete list
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {items === undefined ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : unboughtItems.length === 0 && boughtItems.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-8 w-8" />}
            title="No items yet"
            description="Add something to this list."
          />
        ) : (
          <>
            {unboughtItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3"
              >
                <button
                  onClick={() => handleToggle(item._id)}
                  className="h-5 w-5 rounded border-2 border-[var(--color-border-default)] shrink-0 hover:border-[var(--color-accent)] transition-colors"
                  aria-label={`Mark ${item.name} as bought`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-text-primary)] truncate">
                    {item.name}
                  </p>
                  {item.quantity && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {item.quantity}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {item.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors p-1"
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {boughtItems.length > 0 && (
              <div>
                <button
                  onClick={() => setBoughtExpanded(!boughtExpanded)}
                  className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors py-2"
                >
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      boughtExpanded && "rotate-180"
                    )}
                  />
                  {boughtItems.length} bought
                </button>
                {boughtExpanded &&
                  boughtItems.map((item) => {
                    const buyer = memberMap[item.boughtByUserId ?? ""];
                    return (
                      <div
                        key={item._id}
                        className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3 opacity-50 mb-2"
                      >
                        <button
                          onClick={() => handleToggle(item._id)}
                          className="h-5 w-5 rounded border-2 border-[var(--color-accent)] bg-[var(--color-accent)] shrink-0 flex items-center justify-center"
                          aria-label={`Unmark ${item.name}`}
                        >
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--color-text-primary)] line-through truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {buyer && (
                              <Avatar
                                fallback={buyer.name}
                                src={buyer.imageUrl}
                                size="xs"
                              />
                            )}
                            <span className="text-[10px] text-[var(--color-text-muted)]">
                              {buyer?.name ?? "Someone"} ·{" "}
                              {item.boughtAt ? formatDate(item.boughtAt) : ""}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors p-1"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Item */}
      <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] px-4 py-3">
        <form onSubmit={handleAddItem} className="flex gap-2">
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add item..."
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            size="icon-md"
            loading={adding}
            disabled={!newItemName.trim()}
            aria-label="Add item"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
