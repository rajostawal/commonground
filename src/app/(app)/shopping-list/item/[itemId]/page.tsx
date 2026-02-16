"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { SimpleBottomSheet } from "@/components/ui/SimpleBottomSheet";
import { toast } from "@/hooks/useToast";
import { useSubscription } from "@/hooks/useSubscription";
import { usePolarCheckout } from "@/hooks/usePolarCheckout";
import {
  getItemEmoji,
  getCategoryIcon,
  CATEGORIES,
} from "@/lib/shopping/categories";
import {
  ArrowLeft,
  Lock,
  Crown,
  Trash2,
  Camera,
} from "lucide-react";
import Link from "next/link";
import type { Id } from "@/../convex/_generated/dataModel";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as Id<"shoppingItems">;

  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const { openCheckout } = usePolarCheckout();

  const foundItem = useQuery(api.shoppingItems.getById, { itemId });
  const updateItem = useMutation(api.shoppingItems.updateItem);
  const deleteItem = useMutation(api.shoppingItems.deleteItem);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Populate form from item data
  useEffect(() => {
    if (foundItem && !loaded) {
      setName(foundItem.name);
      setCategory(foundItem.category);
      setNotes(foundItem.notes ?? "");
      setTags(foundItem.tags ?? []);
      setLoaded(true);
    }
  }, [foundItem, loaded]);

  const isDataLoading = foundItem === undefined;

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateItem({
        itemId,
        name: name.trim(),
        category,
        ...(isSubscribed ? { notes: notes.trim() || undefined, tags: tags.length > 0 ? tags : undefined } : {}),
      });
      toast({ title: "Item updated", variant: "success" });
      router.back();
    } catch {
      toast({ title: "Failed to update item", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteItem({ itemId });
      toast({ title: "Item deleted" });
      router.push("/shopping-list");
    } catch {
      toast({ title: "Failed to delete item", variant: "error" });
    }
  }

  function handleAddTag() {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  const emoji = getItemEmoji(name || "item");
  const selectedCat = getCategoryIcon(category);

  if (isDataLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <Link href="/shopping-list">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Item Details
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent)] animate-spin" />
        </div>
      </div>
    );
  }

  if (foundItem === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-[var(--color-text-muted)]">Item not found</p>
        <Link href="/shopping-list">
          <Button variant="ghost" size="sm">Back to Shopping List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </button>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Item Details
          </h1>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors p-2"
          aria-label="Delete item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Premium banner for non-subscribers */}
      {!isSubscribed && !subLoading && (
        <div className="mx-4 mt-4 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-muted)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-[var(--color-accent)]" />
              <p className="text-xs text-[var(--color-accent)]">
                <span className="font-medium">Premium:</span> Add details, images, and tags.
              </p>
            </div>
            <button
              onClick={openCheckout}
              className="text-xs font-medium text-[var(--color-accent)] hover:underline shrink-0"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Item image */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-[var(--color-bg-surface-2)] flex items-center justify-center text-4xl">
            {foundItem?.photoUrl ? (
              <img
                src={foundItem.photoUrl}
                alt={name}
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <span>{emoji}</span>
            )}
          </div>
        </div>

        {/* Name (free) */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            Item name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
          />
        </div>

        {/* Category picker (free) */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            Category
          </label>
          <button
            onClick={() => setShowCategoryPicker(true)}
            className="w-full flex items-center gap-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface-1)] px-3 py-2.5 text-sm text-left"
          >
            {selectedCat ? (
              <>
                <span>{selectedCat.emoji}</span>
                <span className="text-[var(--color-text-primary)]">{selectedCat.label}</span>
              </>
            ) : (
              <span className="text-[var(--color-text-muted)]">Select category</span>
            )}
          </button>
        </div>

        {/* Notes (premium) */}
        <div className="relative">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            Details / Notes
            {!isSubscribed && <Lock className="h-3 w-3" />}
          </label>
          {isSubscribed ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this item..."
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface-1)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-focus)]"
            />
          ) : (
            <div className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface-1)] px-3 py-2.5 text-sm text-[var(--color-text-muted)] opacity-50 cursor-not-allowed min-h-[80px]">
              Add notes about this item...
            </div>
          )}
        </div>

        {/* Tags (premium) */}
        <div className="relative">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            Tags
            {!isSubscribed && <Lock className="h-3 w-3" />}
          </label>
          {isSubscribed ? (
            <>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg-surface-2)] border border-[var(--color-border-subtle)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  Add
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg-surface-2)] border border-[var(--color-border-subtle)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] opacity-50">
                urgent
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg-surface-2)] border border-[var(--color-border-subtle)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] opacity-50">
                organic
              </span>
            </div>
          )}
        </div>

        {/* Photo upload (premium) */}
        <div className="relative">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
            Custom Photo
            {!isSubscribed && <Lock className="h-3 w-3" />}
          </label>
          <button
            disabled={!isSubscribed}
            className={`w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface-1)] px-3 py-4 text-sm transition-colors ${
              isSubscribed
                ? "text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] cursor-pointer"
                : "text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
            }`}
          >
            <Camera className="h-4 w-4" />
            {isSubscribed ? "Upload photo" : "Upload photo (Pro)"}
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] px-4 py-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSave}
          loading={saving}
          disabled={!name.trim()}
        >
          Save Changes
        </Button>
      </div>

      {/* Category Picker */}
      <SimpleBottomSheet
        open={showCategoryPicker}
        onOpenChange={setShowCategoryPicker}
        title="Select category"
      >
        <div className="px-4 pb-6 space-y-1">
          {/* No category option */}
          <button
            onClick={() => {
              setCategory(undefined);
              setShowCategoryPicker(false);
            }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full text-left transition-colors ${
              !category
                ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-1)]"
            }`}
          >
            <span className="text-base">📦</span>
            No category
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id);
                setShowCategoryPicker(false);
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full text-left transition-colors ${
                category === cat.id
                  ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-1)]"
              }`}
            >
              <span className="text-base">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </SimpleBottomSheet>

      {/* Delete Confirmation */}
      <SimpleBottomSheet
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete item"
      >
        <div className="px-4 pb-6">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Are you sure you want to delete &ldquo;{name}&rdquo;? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </SimpleBottomSheet>
    </div>
  );
}
