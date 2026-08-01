import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  listChecklistTemplates,
  upsertChecklistTemplate,
  deleteChecklistTemplate,
  upsertChecklistItem,
  deleteChecklistItem,
  type ChecklistItemRow,
} from "@/lib/checklist-templates.functions";

export const Route = createFileRoute("/_authenticated/portal/checklist-templates")({
  component: ChecklistTemplatesAdminPage,
});

function ChecklistTemplatesAdminPage() {
  const qc = useQueryClient();
  const list = useServerFn(listChecklistTemplates);
  const saveTpl = useServerFn(upsertChecklistTemplate);
  const delTpl = useServerFn(deleteChecklistTemplate);
  const saveItem = useServerFn(upsertChecklistItem);
  const delItem = useServerFn(deleteChecklistItem);

  const { data } = useQuery({
    queryKey: ["checklist-templates-admin"],
    queryFn: () => list(),
  });

  const templates = useMemo(() => data?.templates ?? [], [data]);
  const items = useMemo(() => data?.items ?? [], [data]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const effectiveKey = activeKey ?? templates[0]?.key ?? null;
  const active = templates.find((t) => t.key === effectiveKey) ?? null;
  const activeItems = items.filter((i) => i.template_key === effectiveKey);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["checklist-templates-admin"] });
    qc.invalidateQueries({ queryKey: ["checklist-templates-public"] });
  };

  const upsertTemplate = useMutation({
    mutationFn: async (v: { key: string; title: string; description: string; position: number; active: boolean }) =>
      saveTpl({ data: v }),
    onSuccess: () => { toast.success("Template saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeTemplate = useMutation({
    mutationFn: async (key: string) => delTpl({ data: { key } }),
    onSuccess: () => { toast.success("Template deleted"); setActiveKey(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  type ItemInput = {
    id?: string;
    template_key: string;
    item_key: string;
    title: string;
    note: string | null;
    position: number;
  };
  const upsertItem = useMutation({
    mutationFn: async (v: ItemInput) => saveItem({ data: v }),
    onSuccess: () => { toast.success("Item saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => delItem({ data: { id } }),
    onSuccess: () => { toast.success("Item deleted"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  // New template form
  const [nt, setNt] = useState({ key: "", title: "", description: "", position: 200 });
  // New item form
  const [ni, setNi] = useState({ item_key: "", title: "", note: "", position: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="display-lg font-semibold">Checklist Templates</h1>
          <p className="text-sm text-muted-foreground">
            Manage the arrival & settlement checklists shown to members. Changes go live immediately.
          </p>
        </div>
      </div>

      {/* Templates list */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Templates</div>
          <div className="space-y-1">
            {templates.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveKey(t.key)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                  t.key === effectiveKey ? "border-primary bg-primary/5" : "border-border/60 bg-card hover:border-primary/40"
                }`}
              >
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.key}</div>
                </div>
                {!t.active && <Badge variant="outline">off</Badge>}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-dashed border-border/60 bg-card p-3 space-y-2">
            <div className="text-xs font-medium">New template</div>
            <Input placeholder="key (e.g. anmeldung)" value={nt.key} onChange={(e) => setNt({ ...nt, key: e.target.value })} />
            <Input placeholder="title" value={nt.title} onChange={(e) => setNt({ ...nt, title: e.target.value })} />
            <Textarea rows={2} placeholder="description" value={nt.description} onChange={(e) => setNt({ ...nt, description: e.target.value })} />
            <Input type="number" placeholder="position" value={nt.position} onChange={(e) => setNt({ ...nt, position: Number(e.target.value) || 0 })} />
            <Button
              size="sm"
              disabled={!nt.key || !nt.title || upsertTemplate.isPending}
              onClick={() => {
                upsertTemplate.mutate({ ...nt, active: true });
                setNt({ key: "", title: "", description: "", position: 200 });
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Add template
            </Button>
          </div>
        </div>

        {/* Editor */}
        {active ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Edit template · <span className="font-mono text-xs text-muted-foreground">{active.key}</span></div>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete "${active.title}" and all its items?`)) removeTemplate.mutate(active.key); }}>
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
              </div>
              <TemplateEditor
                initial={active}
                onSave={(v) => upsertTemplate.mutate({ key: active.key, ...v })}
                pending={upsertTemplate.isPending}
              />
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              <div className="mb-3 text-sm font-semibold">Items ({activeItems.length})</div>
              <div className="space-y-2">
                {activeItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onSave={(v) => upsertItem.mutate({ id: item.id, template_key: active.key, ...v })}
                    onDelete={() => removeItem.mutate(item.id)}
                  />
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-dashed border-border/60 p-3 space-y-2">
                <div className="text-xs font-medium">New item</div>
                <Input placeholder="item_key (e.g. rp1)" value={ni.item_key} onChange={(e) => setNi({ ...ni, item_key: e.target.value })} />
                <Input placeholder="title" value={ni.title} onChange={(e) => setNi({ ...ni, title: e.target.value })} />
                <Input placeholder="note (optional)" value={ni.note} onChange={(e) => setNi({ ...ni, note: e.target.value })} />
                <Input type="number" placeholder="position" value={ni.position} onChange={(e) => setNi({ ...ni, position: Number(e.target.value) || 0 })} />
                <Button
                  size="sm"
                  disabled={!ni.item_key || !ni.title || upsertItem.isPending}
                  onClick={() => {
                    upsertItem.mutate({
                      template_key: active.key,
                      item_key: ni.item_key,
                      title: ni.title,
                      note: ni.note || null,
                      position: ni.position,
                    });
                    setNi({ item_key: "", title: "", note: "", position: 100 });
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add item
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            Select a template to edit.
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateEditor({
  initial,
  onSave,
  pending,
}: {
  initial: { title: string; description: string; position: number; active: boolean };
  onSave: (v: { title: string; description: string; position: number; active: boolean }) => void;
  pending: boolean;
}) {
  const [v, setV] = useState(initial);
  return (
    <div className="grid gap-2">
      <Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Title" />
      <Textarea rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Description" />
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" value={v.position} onChange={(e) => setV({ ...v, position: Number(e.target.value) || 0 })} placeholder="Position" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Active
        </label>
      </div>
      <div>
        <Button size="sm" disabled={pending} onClick={() => onSave(v)}>
          <Save className="mr-1 h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  onSave,
  onDelete,
}: {
  item: ChecklistItemRow;
  onSave: (v: { item_key: string; title: string; note: string | null; position: number }) => void;
  onDelete: () => void;
}) {
  const [v, setV] = useState({
    item_key: item.item_key,
    title: item.title,
    note: item.note ?? "",
    position: item.position,
  });
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-3 space-y-2">
      <div className="grid grid-cols-[100px_1fr_80px] gap-2">
        <Input value={v.item_key} onChange={(e) => setV({ ...v, item_key: e.target.value })} placeholder="key" className="font-mono text-xs" />
        <Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="title" />
        <Input type="number" value={v.position} onChange={(e) => setV({ ...v, position: Number(e.target.value) || 0 })} placeholder="pos" />
      </div>
      <Input value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="note (optional)" />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onSave({ ...v, note: v.note || null })}>
          <Save className="mr-1 h-3 w-3" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this item?")) onDelete(); }}>
          <Trash2 className="mr-1 h-3 w-3" /> Delete
        </Button>
      </div>
    </div>
  );
}
