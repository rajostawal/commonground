"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { SimpleBottomSheet } from "@/components/ui/SimpleBottomSheet";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/money/formatters";
import { useSubscription } from "@/hooks/useSubscription";
import {
  getItemEmoji,
  getCategoryForItem,
  getCategoryIcon,
  CATEGORIES,
} from "@/lib/shopping/categories";
import {
  ShoppingCart,
  Plus,
  Trash2,
  ChevronDown,
  List,
  MoreVertical,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Id } from "@/../convex/_generated/dataModel";

export default function ShoppingListPage() {
  const { user } = useUser();
  const household = useQuery(api.households.getMyHousehold);
  const lists = useQuery(
    api.shoppingLists.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const getOrCreateDefault = useMutation(api.shoppingLists.getOrCreateDefault);
  const createItem = useMutation(api.shoppingItems.createItem);
  const toggleBought = useMutation(api.shoppingItems.toggleBought);
  const deleteItem = useMutation(api.shoppingItems.deleteItem);

  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);
  const [boughtExpanded, setBoughtExpanded] = useState(false);
  const [menuItemId, setMenuItemId] = useState<Id<"shoppingItems"> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<Id<"shoppingItems"> | null>(null);

  const { isSubscribed } = useSubscription();

  // Use the first (default) list
  const defaultList = lists?.[0] ?? null;
  const defaultListId = defaultList?._id;

  const items = useQuery(
    api.shoppingItems.listByList,
    defaultListId ? { listId: defaultListId } : "skip"
  );

  const recentItems = useQuery(
    api.shoppingItems.recentlyUsedNames,
    household ? { householdId: household._id } : "skip"
  );

  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );

  const memberMap = Object.fromEntries(
    (members ?? []).map((m) => [
      m.membership.userId,
      { name: m.user?.name ?? "Unknown", imageUrl: m.user?.imageUrl },
    ])
  );

  // Separate items: items is undefined while loading the list, or null/[] once loaded
  const isLoading = household === undefined || lists === undefined;
  const hasNoList = lists !== undefined && lists.length === 0;
  const unboughtItems = items?.filter((i) => !i.boughtByUserId) ?? [];
  const boughtItems = items?.filter((i) => i.boughtByUserId) ?? [];

  // Filter recently used items that aren't already on the current list
  const currentItemNames = new Set(
    (items ?? []).map((i) => i.name.toLowerCase())
  );
  const filteredRecent = (recentItems ?? []).filter(
    (r) => !currentItemNames.has(r.name.toLowerCase())
  );

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim() || !household) return;

    setAdding(true);
    try {
      let listId: Id<"shoppingLists">;
      if (defaultListId) {
        listId = defaultListId;
      } else {
        listId = await getOrCreateDefault({ householdId: household._id });
      }

      const category = getCategoryForItem(newItemName.trim());
      await createItem({ listId, name: newItemName.trim(), category });
      setNewItemName("");
    } catch {
      toast({ title: "Failed to add item", variant: "error" });
    } finally {
      setAdding(false);
    }
  }

  async function handleQuickAdd(name: string, category?: string) {
    if (!household) return;
    try {
      let listId: Id<"shoppingLists">;
      if (defaultListId) {
        listId = defaultListId;
      } else {
        listId = await getOrCreateDefault({ householdId: household._id });
      }
      await createItem({
        listId,
        name,
        category: category ?? getCategoryForItem(name),
      });
    } catch {
      toast({ title: "Failed to add item", variant: "error" });
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

  const menuItem = items?.find((i) => i._id === menuItemId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Shopping List
        </h1>
        {isSubscribed && lists && lists.length > 0 && (
          <div className="flex items-center gap-2">
            {lists.map((list) => (
              <Link key={list._id} href={`/shopping-list/${list._id}`}>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <List className="h-3 w-3" />
                  {list.name}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          // Loading state: show page structure with placeholder
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent)] animate-spin" />
          </div>
        ) : (hasNoList && (!items || items.length === 0)) || (items !== undefined && unboughtItems.length === 0 && boughtItems.length === 0) ? (
          // Empty state
          <EmptyState
            icon={<ShoppingCart className="h-8 w-8" />}
            title="No items yet"
            description="Add something your household needs."
          />
        ) : (
          <>
            {/* To Buy count */}
            {unboughtItems.length > 0 && (
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                To Buy ({unboughtItems.length})
              </p>
            )}

            {/* Active Items */}
            <div className="space-y-2">
              {unboughtItems.map((item) => {
                const emoji = getItemEmoji(item.name);
                const cat = getCategoryIcon(item.category);
                return (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(item._id)}
                      className="h-5 w-5 rounded border-2 border-[var(--color-border-default)] shrink-0 hover:border-[var(--color-accent)] transition-colors"
                      aria-label={`Mark ${item.name} as bought`}
                    />

                    {/* Item image/emoji */}
                    <div className="h-9 w-9 rounded-lg bg-[var(--color-bg-surface-2)] flex items-center justify-center text-lg shrink-0">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                      ) : (
                        <span>{emoji}</span>
                      )}
                    </div>

                    {/* Name + category */}
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

                    {/* Category icon */}
                    {cat && (
                      <span
                        className="text-xs shrink-0"
                        title={cat.label}
                      >
                        {cat.emoji}
                      </span>
                    )}

                    {/* 3-dot menu */}
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

            {/* Bought Items */}
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

        {/* Recently Used - only show when there are items to suggest */}
        {!isLoading && filteredRecent.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3 w-3 text-[var(--color-text-muted)]" />
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                Recently used
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredRecent.map((r) => (
                <button
                  key={r.name}
                  onClick={() => handleQuickAdd(r.name, r.category)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                >
                  <span>{getItemEmoji(r.name)}</span>
                  {r.name}
                  <Plus className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Item Input */}
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
