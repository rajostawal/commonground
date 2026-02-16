"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { SimpleBottomSheet } from "@/components/ui/SimpleBottomSheet";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/money/formatters";
import { SubscriptionGate } from "@/components/features/SubscriptionGate";
import { useSubscription } from "@/hooks/useSubscription";
import {
  getItemEmoji,
  getCategoryForItem,
  getCategoryIcon,
} from "@/lib/shopping/categories";
import {
  ShoppingCart,
  Plus,
  Trash2,
  ChevronDown,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
  const [menuItemId, setMenuItemId] = useState<Id<"shoppingItems"> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<Id<"shoppingItems"> | null>(null);

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
      const category = getCategoryForItem(newItemName.trim());
      await createItem({ listId, name: newItemName.trim(), category });
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
      setConfirmDeleteId(null);
      setMenuItemId(null);
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

  const menuItem = items?.find((i) => i._id === menuItemId);

  if (!isSubscribed) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <Link href="/shopping-list">
            <Button variant="ghost" size="icon" aria-label="Back">
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
          <Button variant="ghost" size="icon" aria-label="Back">
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {items === undefined ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent)] animate-spin" />
          </div>
        ) : unboughtItems.length === 0 && boughtItems.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-8 w-8" />}
            title="No items yet"
            description="Add something to this list."
          />
        ) : (
          <>
            {unboughtItems.length > 0 && (
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                To Buy ({unboughtItems.length})
              </p>
            )}

            <div className="space-y-2">
              {unboughtItems.map((item) => {
                const emoji = getItemEmoji(item.name);
                const cat = getCategoryIcon(item.category);
                return (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3"
                  >
                    <button
                      onClick={() => handleToggle(item._id)}
                      className="h-5 w-5 rounded border-2 border-[var(--color-border-default)] shrink-0 hover:border-[var(--color-accent)] transition-colors"
                      aria-label={`Mark ${item.name} as bought`}
                    />
                    <div className="h-9 w-9 rounded-lg bg-[var(--color-bg-surface-2)] flex items-center justify-center text-lg shrink-0">
                      <span>{emoji}</span>
                    </div>
                    <Link
                      href={`/shopping-list/item/${item._id}`}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-sm text-[var(--color-text-primary)] truncate">
                        {item.name}
                      </p>
                      {item.quantity && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {item.quantity}
                        </p>
                      )}
                    </Link>
                    {cat && (
                      <span className="text-xs shrink-0" title={cat.label}>
                        {cat.emoji}
                      </span>
                    )}
                    <button
                      onClick={() => setMenuItemId(item._id)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors p-1 shrink-0"
                      aria-label={`Actions for ${item.name}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

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
                {boughtExpanded && (
                  <div className="space-y-2">
                    {boughtItems.map((item) => {
                      const buyer = memberMap[item.boughtByUserId ?? ""];
                      const emoji = getItemEmoji(item.name);
                      return (
                        <div
                          key={item._id}
                          className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3 opacity-50"
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
                          <div className="h-9 w-9 rounded-lg bg-[var(--color-bg-surface-2)] flex items-center justify-center text-lg shrink-0">
                            <span>{emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--color-text-primary)] line-through truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {buyer && (
                                <Avatar
                                  fallback={buyer.name}
                                  src={buyer.imageUrl}
                                  size="sm"
                                />
                              )}
                              <span className="text-[10px] text-[var(--color-text-muted)]">
                                {buyer?.name ?? "Someone"} ·{" "}
                                {item.boughtAt ? formatDate(item.boughtAt) : ""}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setMenuItemId(item._id)}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors p-1 shrink-0"
                            aria-label={`Actions for ${item.name}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
            placeholder="What do you have to buy?"
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

      {/* Item Action Menu */}
      <SimpleBottomSheet
        open={menuItemId !== null && confirmDeleteId === null}
        onOpenChange={(open) => {
          if (!open) setMenuItemId(null);
        }}
        title="Item actions"
      >
        {menuItem && (
          <div className="px-4 pb-6 space-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-[var(--color-bg-surface-2)] flex items-center justify-center text-xl">
                {getItemEmoji(menuItem.name)}
              </div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {menuItem.name}
              </p>
            </div>
            <Link
              href={`/shopping-list/item/${menuItem._id}`}
              onClick={() => setMenuItemId(null)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-1)] transition-colors w-full"
            >
              Edit item
            </Link>
            <button
              onClick={() => handleToggle(menuItem._id).then(() => setMenuItemId(null))}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-1)] transition-colors w-full text-left"
            >
              {menuItem.boughtByUserId ? "Unmark as bought" : "Mark as bought"}
            </button>
            <button
              onClick={() => setConfirmDeleteId(menuItem._id)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--color-error)] hover:bg-[var(--color-bg-surface-1)] transition-colors w-full text-left"
            >
              <Trash2 className="h-4 w-4" />
              Delete item
            </button>
          </div>
        )}
      </SimpleBottomSheet>

      {/* Delete Confirmation */}
      <SimpleBottomSheet
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteId(null);
            setMenuItemId(null);
          }
        }}
        title="Delete item"
      >
        <div className="px-4 pb-6">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Are you sure you want to delete this item? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setConfirmDeleteId(null);
                setMenuItemId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </SimpleBottomSheet>
    </div>
  );
}
