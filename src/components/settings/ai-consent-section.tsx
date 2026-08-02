import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BrainCircuit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Aal2Gate } from "@/components/security/aal2-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AI_NOTICE_VERSION,
  getMyAiConsent,
  updateMyAiConsent,
  type AiPurpose,
} from "@/lib/ai-governance.functions";

const PURPOSES: Array<{ id: AiPurpose; label: string; description: string }> = [
  {
    id: "family_guidance",
    label: "Family guidance assistant",
    description: "Send questions and limited conversation context to produce practical guidance.",
  },
  {
    id: "document_analysis",
    label: "Document summaries and extraction",
    description: "Send the document text you choose to summarise or extract structured facts.",
  },
  {
    id: "staff_knowledge",
    label: "Staff knowledge assistant",
    description: "For staff accounts, send questions with approved internal knowledge context.",
  },
];

export function AiConsentSection() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <BrainCircuit className="h-4 w-4 text-primary" />
        <h2 className="font-display text-xl font-semibold">Optional AI processing</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        AI tools are off until you opt in. Selected content is sent to the configured Lovable AI
        gateway. BeistandPlus does not retain prompts; generated results are scheduled for deletion
        after 30 days. AI output can be wrong and must be checked against original and official
        sources.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Notice version: {AI_NOTICE_VERSION}</p>

      <Aal2Gate reason="AI consent changes require two-factor verification.">
        <AiConsentControls />
      </Aal2Gate>
    </div>
  );
}

function AiConsentControls() {
  const getConsent = useServerFn(getMyAiConsent);
  const updateConsent = useServerFn(updateMyAiConsent);
  const queryClient = useQueryClient();
  const consentQ = useQuery({ queryKey: ["ai-consent"], queryFn: () => getConsent() });
  const [selected, setSelected] = useState<AiPurpose[]>([]);

  useEffect(() => {
    if (consentQ.data?.consented) setSelected(consentQ.data.purposes as AiPurpose[]);
  }, [consentQ.data]);

  const update = useMutation({
    mutationFn: (consented: boolean) =>
      updateConsent({ data: { consented, purposes: consented ? selected : [] } }),
    onSuccess: async (_, consented) => {
      await queryClient.invalidateQueries({ queryKey: ["ai-consent"] });
      toast.success(consented ? "AI choices saved" : "AI consent withdrawn");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function toggle(purpose: AiPurpose, checked: boolean) {
    setSelected((current) =>
      checked ? [...new Set([...current, purpose])] : current.filter((item) => item !== purpose),
    );
  }

  return consentQ.isLoading ? (
    <div className="mt-4 flex items-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading AI choices…
    </div>
  ) : (
    <div className="mt-5 space-y-4">
      {PURPOSES.map((purpose) => (
        <label
          key={purpose.id}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-4"
        >
          <Checkbox
            className="mt-0.5"
            checked={selected.includes(purpose.id)}
            onCheckedChange={(checked) => toggle(purpose.id, checked === true)}
          />
          <span>
            <span className="block text-sm font-medium">{purpose.label}</span>
            <span className="block text-xs text-muted-foreground">{purpose.description}</span>
          </span>
        </label>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => update.mutate(true)}
          disabled={update.isPending || selected.length === 0}
        >
          {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save consent
        </Button>
        {consentQ.data?.consented && (
          <Button
            variant="outline"
            onClick={() => update.mutate(false)}
            disabled={update.isPending}
          >
            Withdraw consent
          </Button>
        )}
      </div>
    </div>
  );
}
