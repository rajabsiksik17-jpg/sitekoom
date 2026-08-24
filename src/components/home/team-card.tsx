import { localize } from "@/lib/utils";
import type { TeamMember } from "@/lib/types";

export function TeamCard({ member, locale }: { member: TeamMember; locale: "ar" | "en" }) {
  return (
    <div className="card h-full overflow-hidden text-center">
      <div className="aspect-square w-full overflow-hidden bg-brand-50">
        {member.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photo} alt={localize(locale, member.name_ar, member.name_en)} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-brand-200">
            {localize(locale, member.name_ar, member.name_en)[0]}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-ink-900">{localize(locale, member.name_ar, member.name_en)}</h3>
        <p className="text-sm text-gray-500">{localize(locale, member.position_ar, member.position_en)}</p>
      </div>
    </div>
  );
}
