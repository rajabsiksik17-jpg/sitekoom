import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

const defaults = {
  privacy: {
    ar: "<h2>سياسة الخصوصية</h2><p>نحن في سايتكم نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا للمعلومات التي تقدمها لنا.</p><p>نقوم بجمع المعلومات التي تقدمها طواعية عند التواصل معنا أو استخدام خدماتنا، مثل الاسم والبريد الإلكتروني ورقم الهاتف. نستخدم هذه المعلومات للرد على استفساراتك وتقديم خدماتنا.</p><p>لا نشارك بياناتك مع أي طرف ثالث إلا بما يقتضيه تقديم الخدمة أو بموجب القانون.</p>",
    en: "<h2>Privacy Policy</h2><p>At Sitekoom we respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use and protect the information you provide.</p><p>We collect information you voluntarily provide when contacting us or using our services, such as name, email and phone. We use this information to respond to your inquiries and deliver our services.</p><p>We do not share your data with any third party except as required to provide the service or by law.</p>",
  },
  terms: {
    ar: "<h2>الشروط والأحكام</h2><p>باستخدامك موقع وخدمات سايتكم، فإنك توافق على الشروط والأحكام التالية.</p><p>جميع محتويات الموقع ملك لسايتكم ولا يجوز استخدامها دون إذن. نقدم خدماتنا بمهنية عالية ونلتزم بالجداول الزمنية المتفق عليها.</p><p>تخضع هذه الشروط لقوانين المملكة الأردنية الهاشمية.</p>",
    en: "<h2>Terms &amp; Conditions</h2><p>By using the Sitekoom website and services, you agree to the following terms and conditions.</p><p>All content on the site is owned by Sitekoom and may not be used without permission. We provide our services with high professionalism and adhere to agreed timelines.</p><p>These terms are governed by the laws of the Hashemite Kingdom of Jordan.</p>",
  },
};

async function getLegalContent(key: "privacy" | "terms") {
  const supabase = createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).single();
  return data?.value as { ar?: string; en?: string } | null;
}

export default async function LegalPage({
  params,
  kind,
}: {
  params: { locale: "ar" | "en" };
  kind: "privacy" | "terms";
}) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const custom = await getLegalContent(kind);
  const label = kind === "privacy" ? dict.footer.privacy : dict.footer.terms;
  const content = localize(locale, custom?.ar ?? defaults[kind].ar, custom?.en ?? defaults[kind].en);

  return (
    <>
      <PageHero title={label} pageKey={kind} />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: label, path: `/${kind}` }]} />
        <div className="prose-site mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </>
  );
}
