import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

export interface CountryOption {
  code: string;
  dial: string;
  name: string;
  nameAr: string;
  flag: string;
}

// Curated list (most relevant first, Jordan default).
const RAW: [string, string, string, string][] = [
  ["JO", "962", "Jordan", "الأردن"],
  ["SA", "966", "Saudi Arabia", "السعودية"],
  ["AE", "971", "United Arab Emirates", "الإمارات"],
  ["KW", "965", "Kuwait", "الكويت"],
  ["QA", "974", "Qatar", "قطر"],
  ["BH", "973", "Bahrain", "البحرين"],
  ["OM", "968", "Oman", "عُمان"],
  ["IQ", "964", "Iraq", "العراق"],
  ["SY", "963", "Syria", "سوريا"],
  ["LB", "961", "Lebanon", "لبنان"],
  ["PS", "970", "Palestine", "فلسطين"],
  ["EG", "20", "Egypt", "مصر"],
  ["MA", "212", "Morocco", "المغرب"],
  ["DZ", "213", "Algeria", "الجزائر"],
  ["TN", "216", "Tunisia", "تونس"],
  ["LY", "218", "Libya", "ليبيا"],
  ["SD", "249", "Sudan", "السودان"],
  ["YE", "967", "Yemen", "اليمن"],
  ["TR", "90", "Turkey", "تركيا"],
  ["US", "1", "United States", "الولايات المتحدة"],
  ["CA", "1", "Canada", "كندا"],
  ["GB", "44", "United Kingdom", "المملكة المتحدة"],
  ["DE", "49", "Germany", "ألمانيا"],
  ["FR", "33", "France", "فرنسا"],
  ["IT", "39", "Italy", "إيطاليا"],
  ["ES", "34", "Spain", "إسبانيا"],
  ["NL", "31", "Netherlands", "هولندا"],
  ["SE", "46", "Sweden", "السويد"],
  ["IN", "91", "India", "الهند"],
  ["PK", "92", "Pakistan", "باكستان"],
  ["ID", "62", "Indonesia", "إندونيسيا"],
  ["MY", "60", "Malaysia", "ماليزيا"],
  ["CN", "86", "China", "الصين"],
  ["JP", "81", "Japan", "اليابان"],
  ["KR", "82", "South Korea", "كوريا الجنوبية"],
  ["AU", "61", "Australia", "أستراليا"],
  ["RU", "7", "Russia", "روسيا"],
  ["BR", "55", "Brazil", "البرازيل"],
];

export function flagEmoji(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export const COUNTRIES: CountryOption[] = RAW.map(([code, dial, name, nameAr]) => ({
  code,
  dial: `+${dial}`,
  name,
  nameAr,
  flag: flagEmoji(code),
}));

export const DEFAULT_COUNTRY: CountryOption = COUNTRIES[0];

export function findCountry(code: string): CountryOption {
  return COUNTRIES.find((c) => c.code === code) ?? DEFAULT_COUNTRY;
}

export function findCountryByDial(dial: string): CountryOption | undefined {
  const d = dial.replace(/\D/g, "");
  return COUNTRIES.find((c) => c.dial.replace(/\D/g, "") === d);
}

export function detectCountry(): string {
  if (typeof navigator === "undefined") return "JO";
  try {
    const langs = navigator.languages ?? [navigator.language];
    for (const lang of langs) {
      const region = lang.split(/[-_]/)[1]?.toUpperCase();
      if (region && COUNTRIES.some((c) => c.code === region)) return region;
    }
    // Geo-ip style (best effort via Intl timezone is unreliable) — fallback.
  } catch {
    /* ignore */
  }
  return "JO";
}

export interface PhoneValue {
  countryCode: string;
  dialCode: string;
  nationalNumber: string;
  internationalNumber: string;
  e164: string;
}

export function normalizePhone(nationalNumber: string, countryCode: string): PhoneValue | null {
  const country = findCountry(countryCode);
  const digits = nationalNumber.replace(/\D/g, "");
  const full = `${country.dial}${digits}`;
  const parsed = parsePhoneNumberFromString(full);
  if (!parsed || !parsed.isValid()) return null;

  const intl = parsed.formatInternational(); // +962 79 123 4567
  return {
    countryCode: countryCode,
    dialCode: country.dial,
    nationalNumber: parsed.nationalNumber,
    internationalNumber: intl,
    e164: parsed.number,
  };
}

export function isValidPhone(nationalNumber: string, countryCode: string): boolean {
  try {
    const country = findCountry(countryCode);
    const full = `${country.dial}${nationalNumber.replace(/\D/g, "")}`;
    return isValidPhoneNumber(full, countryCode as CountryCode);
  } catch {
    return false;
  }
}

export function e164FromMeta(countryCode: string, nationalNumber: string): string {
  const v = normalizePhone(nationalNumber, countryCode);
  return v?.e164 ?? "";
}

// Best-effort: extract a dial code from a raw number typed without the selector.
export function dialCodeOf(countryCode: string): string {
  try {
    return `+${getCountryCallingCode(countryCode as CountryCode)}`;
  } catch {
    return findCountry(countryCode).dial;
  }
}
