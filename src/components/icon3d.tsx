import overview from "@/assets/icons3d/overview.png";
import cases from "@/assets/icons3d/cases.png";
import checklists from "@/assets/icons3d/checklists.png";
import plan from "@/assets/icons3d/plan.png";
import documents from "@/assets/icons3d/documents.png";
import providers from "@/assets/icons3d/providers.png";
import assistant from "@/assets/icons3d/assistant.png";
import community from "@/assets/icons3d/community.png";
import knowledge from "@/assets/icons3d/knowledge.png";
import experts from "@/assets/icons3d/experts.png";
import settings from "@/assets/icons3d/settings.png";
import urgent from "@/assets/icons3d/urgent.png";
import settlement from "@/assets/icons3d/settlement.png";
import government from "@/assets/icons3d/government.png";
import visas from "@/assets/icons3d/visas.png";
import legal from "@/assets/icons3d/legal.png";
import employment from "@/assets/icons3d/employment.png";
import housing from "@/assets/icons3d/housing.png";
import healthcare from "@/assets/icons3d/healthcare.png";
import burials from "@/assets/icons3d/burials.png";

const registry = {
  overview,
  cases,
  checklists,
  plan,
  benefits: plan,
  documents,
  providers,
  assistant,
  community,
  knowledge,
  experts,
  settings,
  urgent,
  settlement,
  government,
  visas,
  legal,
  employment,
  housing,
  healthcare,
  burials,
} as const;

export type Icon3DName = keyof typeof registry;

type Props = {
  name: Icon3DName;
  className?: string;
  alt?: string;
};

/**
 * 3D matte claymorphic icon. Renders a transparent PNG scaled to its
 * container. Wrap in a sized box (e.g. h-12 w-12) to control display size.
 */
export function Icon3D({ name, className, alt = "" }: Props) {
  return (
    <img
      src={registry[name]}
      alt={alt}
      loading="lazy"
      width={1024}
      height={1024}
      className={`h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(20,15,10,0.18)] ${className ?? ""}`}
    />
  );
}
