import type { BlogBlock, PostTranslation } from "./blog-posts";

/**
 * Per-post translations for DE, TR and AR. The remaining supported locales
 * fall back to the source (English) body — never hidden, always readable.
 *
 * Keyed by post slug. Every entry translates title, excerpt, coverAlt and the
 * full body. Body structure (paragraph / heading / list order) mirrors the
 * source so the reading experience is identical across languages.
 */
type TranslationsBySlug = Record<string, Record<"de" | "tr" | "ar", PostTranslation>>;

const t = (
  title: string,
  excerpt: string,
  coverAlt: string,
  body: BlogBlock[],
): PostTranslation => ({ title, excerpt, coverAlt, body });

export const BLOG_TRANSLATIONS: TranslationsBySlug = {
  "anmeldung-in-14-days": {
    de: t(
      "Anmeldung in 14 Tagen: Adressanmeldung ohne Stress",
      "Jede Neuankunft in Deutschland muss sich innerhalb von 14 Tagen anmelden. Hier finden Sie die Unterlagen, Termin-Tricks und was zu tun ist, wenn Sie keinen Slot bekommen.",
      "Eine junge Familie kommt mit Papieren an einem Berliner Bahnhof an",
      [
        { type: "p", text: "Die Anmeldung ist das Wichtigste, was Sie in Ihren ersten zwei Wochen in Deutschland erledigen. Fast jeder weitere Verwaltungsschritt — Steuer-ID, Bankkonto, Krankenversicherung, Aufenthaltstitel — beginnt mit Ihrer Anmeldebestätigung. Wer die 14-Tage-Frist verpasst, riskiert ein Bußgeld und noch mehr Verzögerungen." },
        { type: "h2", text: "Was Sie brauchen" },
        { type: "ul", items: ["Reisepass oder Personalausweis", "Ausgefülltes Anmeldeformular (wir füllen es für Sie vor)", "Wohnungsgeberbestätigung — die kurze Bestätigung des Vermieters", "Heirats- und Geburtsurkunden für alle, die mit Ihnen angemeldet werden"] },
        { type: "h2", text: "Einen Termin bekommen" },
        { type: "p", text: "Termine in Berlin, Hamburg und München sind innerhalb von Sekunden weg. Unsere Fallmanager überwachen mehrere Bürgeramt-Kalender rund um die Uhr und buchen den ersten Termin, den Sie realistisch wahrnehmen können. Erscheint innerhalb der 14 Tage nichts, helfen wir bei einer schriftlichen Meldung, damit kein Bußgeld verhängt werden kann." },
        { type: "h2", text: "Was danach kommt" },
        { type: "p", text: "Ihre Anmeldebestätigung ist ein einzelnes gestempeltes A4-Blatt — hüten Sie es. Die Steuer-ID kommt 2–3 Wochen später per Post. Damit können Sie ein echtes Girokonto eröffnen und Ihre Krankenversicherung abschließen." },
      ],
    ),
    tr: t(
      "14 günde Anmeldung: adres kaydını sakin yapmanın yolu",
      "Almanya'ya yeni gelen herkes 14 gün içinde adresini kaydettirmek zorunda. Gerekli evrak, randevu ipuçları ve yer bulamazsanız ne yapacağınız burada.",
      "Genç bir aile Berlin tren istasyonuna evraklarıyla varıyor",
      [
        { type: "p", text: "Anmeldung, Almanya'daki ilk iki haftanızda yapacağınız en önemli işlem. Vergi kimlik numarası, banka hesabı, sağlık sigortası, oturma izni gibi her şey Anmeldebestätigung ile başlar. 14 günü kaçırırsanız hem para cezası hem de haftalarca gecikme yaşarsınız." },
        { type: "h2", text: "İhtiyacınız olanlar" },
        { type: "ul", items: ["Pasaport veya kimlik", "Doldurulmuş Anmeldeformular (biz sizin için önceden hazırlıyoruz)", "Wohnungsgeberbestätigung — kısa ev sahibi teyidi", "Sizinle birlikte kayıt olacak herkes için evlilik ve doğum belgeleri"] },
        { type: "h2", text: "Randevu bulmak" },
        { type: "p", text: "Berlin, Hamburg ve Münih'te randevular saniyeler içinde kayboluyor. Fall yöneticilerimiz birden fazla Bürgeramt takvimini 7/24 tarar ve gerçekten gidebileceğiniz ilk randevuyu ayırtır. 14 gün içinde hiçbir şey çıkmazsa yazılı bildirim göndermenize yardım ederiz, böylece ceza kesilmez." },
        { type: "h2", text: "Sonrasında" },
        { type: "p", text: "Anmeldebestätigung tek bir mühürlü A4 sayfasıdır — iyi saklayın. Vergi kimliğiniz 2–3 hafta sonra postayla gelir. Bu, gerçek bir Girokonto açmanız ve sağlık sigortanızı sonlandırmanız için yeşil ışıktır." },
      ],
    ),
    ar: t(
      "التسجيل خلال 14 يومًا: طريقة هادئة لتسجيل عنوانك",
      "على كل قادم جديد إلى ألمانيا تسجيل عنوانه خلال 14 يومًا. إليك الأوراق المطلوبة، وحيل الحصول على موعد، وما تفعله إن لم تجد موعدًا.",
      "عائلة شابة تصل إلى محطة قطار في برلين وبيدها الأوراق",
      [
        { type: "p", text: "التسجيل (Anmeldung) هو أهم إجراء ستقوم به في أسبوعيك الأولين في ألمانيا. تقريبًا كل معاملة أخرى — الرقم الضريبي، الحساب البنكي، التأمين الصحي، تصريح الإقامة — تبدأ من شهادة التسجيل. تفويت مهلة 14 يومًا يعني غرامة، والأهم: أسابيع من التأخير." },
        { type: "h2", text: "ما تحتاجه" },
        { type: "ul", items: ["جواز السفر أو الهوية الوطنية", "استمارة Anmeldeformular مكتملة (نملؤها لك مسبقًا)", "Wohnungsgeberbestätigung — تأكيد قصير من المالك", "شهادات الزواج والميلاد لكل من سيُسجَّل معك"] },
        { type: "h2", text: "الحصول على موعد" },
        { type: "p", text: "المواعيد في برلين وهامبورغ وميونخ تختفي خلال ثوانٍ. مديرو الحالات لدينا يراقبون تقاويم عدة مكاتب Bürgeramt على مدار الساعة، ويحجزون أول موعد يمكنك حضوره فعليًا. إن لم يظهر شيء خلال 14 يومًا نساعدك بإرسال إخطار خطي كي لا تُفرض عليك أي غرامة." },
        { type: "h2", text: "ما يلي ذلك" },
        { type: "p", text: "شهادة Anmeldebestätigung ورقة A4 مختومة واحدة — احرص عليها. سيصلك الرقم الضريبي بالبريد خلال 2–3 أسابيع. عندها يمكنك فتح حساب Girokonto كامل واستكمال التأمين الصحي." },
      ],
    ),
  },

  "kindergeld-family-guide": {
    de: t(
      "Kindergeld: der einfache Leitfaden zum deutschen Kindergeld",
      "Jedes Kind in Deutschland hat Anspruch auf Kindergeld — derzeit 250 € pro Monat. Wer Anspruch hat, was einzureichen ist und was bei einer Ablehnung zu tun ist.",
      "Elternteil und Kleinkind füllen Papiere am Küchentisch aus",
      [
        { type: "p", text: "Kindergeld ist die einheitliche monatliche Familienleistung in Deutschland — 250 € pro Kind, gezahlt von der Familienkasse, unabhängig vom Einkommen. Es läuft bis zum 18. Lebensjahr und kann bis 25 verlängert werden, wenn Ihr Kind noch in Ausbildung ist." },
        { type: "h2", text: "Wer Anspruch hat" },
        { type: "p", text: "Anspruch haben Sie (oder Ihr Partner), wenn Sie in Deutschland unbeschränkt steuerpflichtig sind oder einen Aufenthaltstitel mit Arbeitserlaubnis besitzen. EU-Bürger haben automatisch Anspruch. Für Nicht-EU-Bürger kommt es auf die Kategorie des Aufenthaltstitels an — wir prüfen Ihre vor Antragstellung." },
        { type: "h2", text: "Was einzureichen ist" },
        { type: "ul", items: ["Antrag auf Kindergeld (Hauptformular)", "Anlage Kind für jedes Kind", "Steueridentifikationsnummer Ihres Kindes und Ihre eigene", "Geburtsurkunde (mit beglaubigter Übersetzung, wenn nicht auf Deutsch)", "Für ältere Kinder in Ausbildung: Immatrikulations- oder Ausbildungsnachweis"] },
        { type: "h2", text: "Bei Ablehnung" },
        { type: "p", text: "Die meisten Ablehnungen sind formal, nicht inhaltlich — eine fehlende Übersetzung, unklare Aufenthaltskategorie oder falsche Steuer-ID. Sie haben einen Monat ab dem Ablehnungsschreiben Zeit für einen Widerspruch. Lassen Sie diese Frist nicht verstreichen." },
      ],
    ),
    tr: t(
      "Kindergeld: Almanya'nın çocuk yardımı için sade rehber",
      "Almanya'daki her çocuğun Kindergeld hakkı var — şu anda aylık 250 €. Kimin uygun olduğu, hangi belgelerin verildiği ve reddedildiyseniz ne yapacağınız burada.",
      "Bir ebeveyn ve küçük çocuk mutfak masasında evrak dolduruyor",
      [
        { type: "p", text: "Kindergeld, Almanya'nın sabit aylık çocuk yardımıdır — çocuk başına ayda 250 €, gelirden bağımsız olarak Familienkasse tarafından ödenir. 18 yaşına kadar sürer; çocuğunuz hâlâ eğitim veya mesleki eğitimdeyse 25'e kadar uzayabilir." },
        { type: "h2", text: "Kim uygundur" },
        { type: "p", text: "Siz (veya eşiniz) Almanya'da yaşıyor ve tam gelir vergisi mükellefiyseniz ya da çalışmaya izin veren bir oturma izniniz varsa uygunsunuz. AB vatandaşları otomatik olarak uygundur. AB dışı vatandaşlar için oturma izni kategorisi önemlidir — başvuru öncesi sizinkini kontrol ederiz." },
        { type: "h2", text: "Ne göndereceksiniz" },
        { type: "ul", items: ["Antrag auf Kindergeld (ana form)", "Her çocuk için Anlage Kind", "Çocuğunuzun ve sizin Steueridentifikationsnummer'iniz", "Doğum belgesi (Almanca değilse yeminli tercümesiyle)", "Eğitimdeki büyük çocuklar için okul kaydı veya çıraklık teyidi"] },
        { type: "h2", text: "Reddedilirseniz" },
        { type: "p", text: "Retlerin çoğu içeriksel değil, idaridir — eksik bir tercüme, belirsiz oturma kategorisi ya da uyuşmayan bir vergi kimliği. Ret mektubundan itibaren bir ay içinde Widerspruch (itiraz) yapabilirsiniz. Bu süreyi kaçırmayın." },
      ],
    ),
    ar: t(
      "Kindergeld: دليل مبسّط لعلاوة الأطفال في ألمانيا",
      "لكل طفل في ألمانيا الحق في Kindergeld — حاليًا 250 € شهريًا. إليك من يستحق، وما يقدَّم، وماذا تفعل إذا رُفض طلبك.",
      "أحد الوالدين وطفل صغير يملأان أوراقًا على طاولة المطبخ",
      [
        { type: "p", text: "Kindergeld هو دعم شهري ثابت للأطفال في ألمانيا — 250 € لكل طفل شهريًا، تدفعها Familienkasse بغض النظر عن الدخل. يستمر حتى بلوغ الطفل 18 عامًا، ويمكن تمديده حتى 25 إذا كان لا يزال في تعليم أو تدريب مهني." },
        { type: "h2", text: "من يستحق" },
        { type: "p", text: "تستحقه أنت (أو شريكك) إذا كنتما مقيمَين في ألمانيا وخاضعَين لضريبة الدخل الكاملة، أو تحملان تصريح إقامة يسمح بالعمل. مواطنو الاتحاد الأوروبي مؤهلون تلقائيًا. لمواطني دول خارج الاتحاد الأوروبي تعتمد الأهلية على فئة الإقامة — نحن نتحقق من فئتك قبل تقديم الطلب." },
        { type: "h2", text: "ما يجب تقديمه" },
        { type: "ul", items: ["Antrag auf Kindergeld (النموذج الرئيسي)", "Anlage Kind لكل طفل", "الرقم الضريبي لطفلك ولك", "شهادة الميلاد (مع ترجمة محلّفة إن لم تكن بالألمانية)", "للأطفال الأكبر في التعليم: إثبات التسجيل أو التدريب المهني"] },
        { type: "h2", text: "إذا رُفض طلبك" },
        { type: "p", text: "معظم حالات الرفض إدارية لا موضوعية — ترجمة ناقصة، فئة إقامة غير واضحة، أو رقم ضريبي غير مطابق. لديك شهر واحد من تاريخ خطاب الرفض لتقديم اعتراض (Widerspruch). لا تدع هذه المهلة تفوتك." },
      ],
    ),
  },

  "first-72-hours-after-a-death": {
    de: t(
      "Todesfall in Deutschland: Was in den ersten 72 Stunden zu tun ist",
      "Ein ruhiger, Schritt-für-Schritt-Leitfaden für Familien bei einem Todesfall in Deutschland — die Urkunden, die Fristen und die Entscheidungen, die Sie nicht allein treffen müssen.",
      "Zwei Hände halten eine weiße Blume über einem gefalteten Brief",
      [
        { type: "p", text: "Wenn jemand in Deutschland stirbt, beginnt der Papierkram sofort — und vieles hat kurze Fristen. Dies ist ein Leitfaden in klarer Sprache durch die ersten 72 Stunden, damit Sie genau wissen, was in welcher Reihenfolge geschehen muss. Jeder Schritt kann von einem Beistand-Fallmanager für oder mit Ihnen erledigt werden, in Ihrer Sprache, zu jeder Uhrzeit." },
        { type: "h2", text: "Stunde 0–4: der Totenschein" },
        { type: "p", text: "Ein Arzt muss den Tod feststellen und den Totenschein ausstellen. Bei einem Todesfall zu Hause rufen Sie den Hausarzt oder die 112. In Krankenhaus oder Pflegeheim wird dies vom Personal organisiert." },
        { type: "h2", text: "Tag 1: einen Bestatter beauftragen" },
        { type: "p", text: "In Deutschland darf ein Verstorbener nur von einem zugelassenen Bestatter überführt werden. Sie haben Zeit zu wählen — Sie müssen nicht den ersten vom Krankenhaus oder Heim vorgeschlagenen Bestatter akzeptieren. Fordern Sie vor jeder Unterschrift einen schriftlichen Kostenvoranschlag." },
        { type: "h2", text: "Tag 2–3: die Sterbeurkunde" },
        { type: "p", text: "Die Sterbeurkunde stellt das örtliche Standesamt innerhalb weniger Werktage aus. Sie brauchen mehrere beglaubigte Ausfertigungen — Banken, Versicherer, Rententräger und Ausländerbehörde verlangen jeweils ein eigenes Original." },
        { type: "h2", text: "Innerhalb weniger Tage: die Beisetzung" },
        { type: "p", text: "Deutsches Recht schreibt eine Bestattung oder Einäscherung innerhalb einer je nach Bundesland unterschiedlichen Frist vor (typisch 4 bis 10 Tage). Für Familien mit Überführung ins Ausland — einschließlich islamischer Janazah und Bestattung im Herkunftsland — müssen die Papiere und Genehmigungen bereits am ersten Tag beginnen." },
      ],
    ),
    tr: t(
      "Almanya'da bir yakınınızı kaybettiğinizde: ilk 72 saatte yapılacaklar",
      "Almanya'da vefat durumuyla karşılaşan aileler için sakin ve adım adım rehber — gereken belgeler, geçerli süreler ve tek başınıza vermek zorunda olmadığınız kararlar.",
      "Katlanmış bir mektup üzerinde beyaz bir çiçek tutan iki el",
      [
        { type: "p", text: "Almanya'da biri vefat ettiğinde evrak işleri hemen başlar — ve çoğunun süresi kısadır. Aşağıda ilk 72 saati sade bir dille anlatıyoruz; hangi işlem hangi sırada yapılmalı, tam olarak göreceksiniz. Her adımı bir Beistand fall yöneticisi kendi dilinizde, günün her saatinde sizin adınıza ya da sizinle birlikte yapabilir." },
        { type: "h2", text: "0–4. saat: Totenschein" },
        { type: "p", text: "Vefatın bir doktor tarafından tespit edilip Totenschein (ölüm belgesi) düzenlenmesi gerekir. Vefat evde ise aile hekimini veya 112'yi arayın. Hastane veya bakım evinde ise personel bunu ayarlar." },
        { type: "h2", text: "1. gün: bir cenaze işleri şirketine ulaşın" },
        { type: "p", text: "Almanya'da naaş yalnızca lisanslı bir Bestatter tarafından nakledilebilir. Seçim için zamanınız var — hastanenin veya bakım evinin önerdiği ilk şirketi kabul etmek zorunda değilsiniz. İmzalamadan önce yazılı fiyat teklifi (Kostenvoranschlag) isteyin." },
        { type: "h2", text: "2–3. gün: Sterbeurkunde" },
        { type: "p", text: "Resmi ölüm belgesi (Sterbeurkunde) yerel Standesamt tarafından birkaç iş günü içinde düzenlenir. Birden fazla onaylı nüshaya ihtiyacınız olur — bankalar, sigortacılar, emeklilik kurumları ve Ausländerbehörde ayrı ayrı asıl belge ister." },
        { type: "h2", text: "Birkaç gün içinde: cenaze töreni" },
        { type: "p", text: "Alman yasaları defin veya yakmanın eyalete göre belirli bir süre içinde (genellikle 4–10 gün) yapılmasını şart koşar. Yurt dışına nakil gereken aileler — İslami cenaze namazı ve memlekete defin dahil — evrak ve izinlere birinci günden başlamalıdır." },
      ],
    ),
    ar: t(
      "فقدان أحد أحبائك في ألمانيا: ما يجب فعله في الـ72 ساعة الأولى",
      "دليل هادئ خطوة بخطوة للعائلات التي تواجه وفاة في ألمانيا — الشهادات المطلوبة، والمواعيد النهائية، والقرارات التي لست مضطرًا لاتخاذها بمفردك.",
      "يدان تحملان زهرة بيضاء فوق رسالة مطوية",
      [
        { type: "p", text: "عندما يتوفى شخص في ألمانيا تبدأ الأوراق فورًا — ومعظمها بمواعيد قصيرة. هذا شرح مبسّط للـ72 ساعة الأولى حتى تعرف بالضبط ما يجب فعله وبأي ترتيب. كل خطوة يمكن أن يقوم بها مدير حالة من Beistand بدلًا منك أو معك، بلغتك، في أي وقت." },
        { type: "h2", text: "الساعات 0–4: شهادة الوفاة الأولية (Totenschein)" },
        { type: "p", text: "يجب أن يؤكد طبيب الوفاة ويصدر Totenschein. إذا كانت الوفاة في البيت اتصل بطبيب العائلة أو الرقم 112. في المستشفى أو دار الرعاية يتولى الطاقم الأمر." },
        { type: "h2", text: "اليوم الأول: التواصل مع منظّم مراسم الدفن" },
        { type: "p", text: "في ألمانيا لا يُنقل الجثمان إلا بواسطة Bestatter مرخّص. لديك وقت لاختيار المنظّم — لست مضطرًا لقبول أول من تقترحه المستشفى أو الدار. اطلب عرض تكاليف مكتوبًا (Kostenvoranschlag) قبل أي توقيع." },
        { type: "h2", text: "اليوم 2–3: شهادة الوفاة الرسمية (Sterbeurkunde)" },
        { type: "p", text: "تُصدر Sterbeurkunde من مكتب الأحوال المدنية (Standesamt) خلال أيام عمل قليلة. ستحتاج نسخًا معتمَدة متعددة — البنوك وشركات التأمين وصناديق التقاعد وسلطة الأجانب كل منها يطلب أصلًا خاصًا به." },
        { type: "h2", text: "خلال أيام قليلة: الجنازة" },
        { type: "p", text: "يشترط القانون الألماني الدفن أو الحرق خلال مدة تختلف حسب الولاية (عادة 4 إلى 10 أيام). للعائلات التي تحتاج إلى نقل الجثمان إلى الخارج — بما في ذلك صلاة الجنازة الإسلامية والدفن في بلد المنشأ — يجب أن تبدأ الأوراق والتصاريح من اليوم الأول." },
      ],
    ),
  },

  "residence-permit-renewal": {
    de: t(
      "Aufenthaltstitel verlängern — ohne schlaflose Nächte",
      "Ihr deutscher Aufenthaltstitel läuft bald ab. Wie Sie die Verlängerung früh starten, was bei einer langsamen Ausländerbehörde passiert und wie Sie weiter arbeiten und reisen können.",
      "Ein deutscher Reisepass und eine blaue Aufenthaltstitelkarte auf einem Schreibtisch",
      [
        { type: "p", text: "Verlängerungen dauern fast immer länger, als die Ausländerbehörde ankündigt. Sicherste Regel: sechs Monate vor Ablauf beginnen. Läuft der Titel vor Ihrem Termin ab, haben Sie Anspruch auf eine Fiktionsbescheinigung — sie erhält Ihren legalen Status, Ihre Arbeitserlaubnis und (meist) das Reiserecht bis zur Entscheidung." },
        { type: "h2", text: "Früh anfangen — und online anfangen" },
        { type: "p", text: "Die meisten Städte bieten Online-Buchung. Berlin, München und Hamburg geben Termine zu festen Zeiten frei; unsere Fallmanager überwachen diese Warteschlangen für Sie." },
        { type: "h2", text: "Übliche Unterlagen" },
        { type: "ul", items: ["Reisepass, aktueller Aufenthaltstitel und neues biometrisches Foto", "Meldebescheinigung", "Einkommensnachweis und Krankenversicherung", "Angestellte: Arbeitsvertrag und aktuelle Gehaltsabrechnungen", "Studierende: Immatrikulation und Nachweis der Finanzierung"] },
        { type: "h2", text: "Wenn der Termin nach Ablauf liegt" },
        { type: "p", text: "Fordern Sie eine Fiktionsbescheinigung. Sie ist nicht automatisch — Sie müssen sie schriftlich beantragen, idealerweise mit dem Verlängerungsantrag. Wir tun das für jede von uns betreute Familie standardmäßig." },
      ],
    ),
    tr: t(
      "Aufenthaltstitel yenileme — uykusuz gecelere gerek yok",
      "Alman oturma izniniz bitmek üzere. Yenilemeye erken başlamanın yolu, Ausländerbehörde yavaşsa ne olur, ve bu süreçte nasıl çalışıp seyahat edersiniz.",
      "Bir masada Alman pasaportu ve mavi Aufenthaltstitel kartı",
      [
        { type: "p", text: "Yenilemeler neredeyse her zaman Ausländerbehörde'nin söylediğinden daha uzun sürer. En güvenlisi bitiş tarihinden 6 ay önce başlamak. İzniniz yenileme randevusundan önce biterse Fiktionsbescheinigung alma hakkınız vardır — bu belge yasal statünüzü, çalışma iznini ve çoğunlukla seyahat hakkını karar verilene kadar korur." },
        { type: "h2", text: "Erken ve online başlayın" },
        { type: "p", text: "Çoğu şehirde artık online randevu var. Berlin, Münih ve Hamburg belirli saatlerde slot açıyor; fall yöneticilerimiz bu kuyrukları sizin için izliyor." },
        { type: "h2", text: "Genelde gereken belgeler" },
        { type: "ul", items: ["Pasaport, mevcut oturma izni ve güncel biyometrik fotoğraf", "Meldebescheinigung (adres teyidi)", "Gelir ve sağlık sigortası kanıtı", "Çalışanlar: iş sözleşmesi ve son maaş bordroları", "Öğrenciler: kayıt belgesi ve mali yeterlilik kanıtı"] },
        { type: "h2", text: "Randevu bitiş tarihinden sonraysa" },
        { type: "p", text: "Fiktionsbescheinigung isteyin. Otomatik verilmez — yenileme başvurusuyla birlikte yazılı olarak talep etmelisiniz. Biz yardım ettiğimiz her aile için bunu varsayılan olarak yapıyoruz." },
      ],
    ),
    ar: t(
      "تجديد تصريح الإقامة دون قلق",
      "تصريح إقامتك في ألمانيا يوشك على الانتهاء. كيف تبدأ التجديد مبكرًا، وماذا يحدث إذا كانت سلطة الأجانب بطيئة، وكيف تواصل العمل والسفر في هذه الأثناء.",
      "جواز سفر ألماني وبطاقة تصريح إقامة زرقاء على مكتب",
      [
        { type: "p", text: "التجديد يستغرق دائمًا وقتًا أطول مما تقوله سلطة الأجانب. القاعدة الأكثر أمانًا: ابدأ قبل انتهاء التصريح بستة أشهر. إذا انتهى التصريح قبل موعد التجديد يحق لك الحصول على Fiktionsbescheinigung — شهادة تحافظ على وضعك القانوني وحقك في العمل وفي أغلب الأحيان حقك في السفر إلى حين صدور القرار." },
        { type: "h2", text: "ابدأ مبكرًا — وابدأ عبر الإنترنت" },
        { type: "p", text: "توفر معظم المدن الآن حجزًا إلكترونيًا. برلين وميونخ وهامبورغ يفتحون مواعيد في أوقات محددة أسبوعيًا؛ مديرو الحالات لدينا يراقبون هذه القوائم بدلًا منك." },
        { type: "h2", text: "الوثائق المطلوبة عادةً" },
        { type: "ul", items: ["جواز السفر، وتصريح الإقامة الحالي، وصورة بيومترية حديثة", "Meldebescheinigung (إثبات العنوان)", "إثبات دخل وتأمين صحي", "للموظفين: عقد العمل وأحدث كشوف الرواتب", "للطلاب: شهادة التسجيل وإثبات الموارد المالية"] },
        { type: "h2", text: "إذا كان الموعد بعد انتهاء التصريح" },
        { type: "p", text: "اطلب Fiktionsbescheinigung. لا تُصدر تلقائيًا — يجب طلبها كتابيًا، ويفضّل مع طلب التجديد. نحن نفعل ذلك افتراضيًا لكل عائلة نساعدها." },
      ],
    ),
  },

  "opening-a-german-bank-account": {
    de: t(
      "Ein deutsches Bankkonto vor der Anmeldung eröffnen",
      "Oft brauchen Sie ein Konto, bevor Sie eine gemeldete Adresse haben — und eine Adresse, bevor Sie Ihr Einkommen nachweisen können. So durchbrechen Sie diese Schleife.",
      "Person eröffnet ein deutsches Bankkonto am Laptop mit einer Kaffeetasse daneben",
      [
        { type: "p", text: "Vermieter verlangen SCHUFA und Kontoauszug. Arbeitgeber verlangen eine IBAN vor dem ersten Gehalt. Aber die meisten klassischen deutschen Banken wollen erst eine Anmeldebestätigung sehen, bevor sie ein Girokonto eröffnen. Es gibt drei praktische Wege aus dieser Schleife." },
        { type: "h2", text: "1. Eine Digitalbank" },
        { type: "p", text: "N26, Revolut, Bunq und Wise eröffnen ein Euro-Konto allein mit Reisepass und Selfie. Sie erhalten am selben Tag eine funktionsfähige IBAN. Die meisten Vermieter in Berlin und München akzeptieren das inzwischen für die erste Miete und die Kaution." },
        { type: "h2", text: "2. Ein Basiskonto" },
        { type: "p", text: "Jede Bank in Deutschland ist gesetzlich verpflichtet, jedem legal Anwesenden ein Basiskonto anzubieten — auch ohne Anmeldung. Bei einer Ablehnung: schriftliche Begründung anfordern, oft reicht das schon." },
        { type: "h2", text: "3. Nach der Anmeldung wechseln" },
        { type: "p", text: "Sobald Sie Meldeadresse und Steuer-ID haben, wechseln Sie zu einem vollwertigen Girokonto Ihrer Wahl. Wir begleiten Familien dabei ohne verpasste Gehaltszahlung." },
      ],
    ),
    tr: t(
      "Anmeldung'dan önce Alman banka hesabı açmak",
      "Çoğu zaman kayıtlı adresiniz olmadan hesap gerekiyor — hesap olmadan gelirinizi ispatlayamıyorsunuz. Bu tavuk-yumurta döngüsünü nasıl kırarsınız?",
      "Bir kişi dizüstü bilgisayarda Alman banka hesabı açarken yanında kahve fincanı",
      [
        { type: "p", text: "Ev sahipleri SCHUFA ve banka özeti ister. İşverenler ilk maaş öncesi IBAN ister. Ama geleneksel Alman bankalarının çoğu Girokonto açmak için Anmeldebestätigung görmek ister. Bu döngüden çıkmanın üç pratik yolu var." },
        { type: "h2", text: "1. Dijital öncelikli bir banka" },
        { type: "p", text: "N26, Revolut, Bunq ve Wise sadece pasaport ve selfie ile euro hesabı açar. Aynı gün çalışan bir IBAN alırsınız. Berlin ve Münih'teki ev sahiplerinin çoğu bunu ilk kira ve depozito için artık kabul ediyor." },
        { type: "h2", text: "2. Temel hesap (Basiskonto)" },
        { type: "p", text: "Almanya'daki her banka, ülkede yasal olarak bulunan herkese — Anmeldung olmasa bile — Basiskonto sunmakla yasal olarak yükümlüdür. Reddedilirseniz reddi yazılı isteyin; genelde bu tek başına ret kararını çevirir." },
        { type: "h2", text: "3. Anmeldung tamam olunca değiştirin" },
        { type: "p", text: "Kayıtlı adres ve vergi kimliğiniz olduğunda seçtiğiniz bankada tam Girokonto'ya geçin. Bunu maaş ödemesi kaçırmadan yapmanıza yardım ediyoruz." },
      ],
    ),
    ar: t(
      "فتح حساب بنكي ألماني قبل التسجيل (Anmeldung)",
      "غالبًا تحتاج إلى حساب قبل أن تحصل على عنوان مسجل — وإلى عنوان قبل أن تُثبت دخلك. إليك كيف تكسر هذه الحلقة.",
      "شخص يفتح حسابًا بنكيًا ألمانيًا على حاسوب محمول بجانب فنجان قهوة",
      [
        { type: "p", text: "المُلاّك يطلبون SCHUFA وكشف حساب. أصحاب العمل يطلبون IBAN قبل أول راتب. لكن معظم البنوك الألمانية التقليدية تطلب Anmeldebestätigung قبل فتح Girokonto. هناك ثلاث طرق عملية للخروج من هذه الحلقة." },
        { type: "h2", text: "1. بنك رقمي" },
        { type: "p", text: "N26 وRevolut وBunq وWise تفتح لك حساب يورو بجواز السفر وسيلفي فقط. تحصل على IBAN عامل في اليوم نفسه. معظم مُلاّك برلين وميونخ يقبلون هذا الآن لأول إيجار وللتأمين." },
        { type: "h2", text: "2. الحساب الأساسي (Basiskonto)" },
        { type: "p", text: "كل بنك في ألمانيا ملزم قانونيًا بتقديم Basiskonto لكل شخص مقيم بشكل قانوني — حتى بدون Anmeldung. إذا رُفض طلبك اطلب الرفض كتابيًا؛ ذلك وحده كافٍ عادةً لعكس القرار." },
        { type: "h2", text: "3. التحويل بعد إتمام التسجيل" },
        { type: "p", text: "بمجرد أن يكون لديك عنوان مسجل ورقم ضريبي انتقل إلى Girokonto كامل في البنك الذي تختاره. نساعد العائلات في ذلك دون تفويت أي راتب." },
      ],
    ),
  },

  "public-vs-private-health-insurance": {
    de: t(
      "Gesetzlich oder privat: welche Krankenversicherung wirklich zu Ihrer Familie passt",
      "Gesetzlich oder privat? Die Entscheidung begleitet Sie über Jahre und ist schwer umkehrbar. Hier die einfache Version, wer wo spart.",
      "Eine deutsche Gesundheitskarte auf einem Holzschreibtisch neben einem Stethoskop",
      [
        { type: "p", text: "Das deutsche Gesundheitswesen läuft auf zwei parallelen Strängen: gesetzliche Krankenversicherung (GKV) und private Krankenversicherung (PKV). Die meisten Neuankömmlinge landen automatisch in der GKV — meist die richtige Entscheidung, aber nicht immer." },
        { type: "h2", text: "GKV in einem Absatz" },
        { type: "p", text: "Die Beiträge sind ein fester Anteil Ihres Bruttolohns (rund 14,6 % + kleiner Zusatzbeitrag), geteilt mit Ihrem Arbeitgeber. Ihr nicht-verdienender Ehepartner und Kinder sind kostenlos mitversichert. Sie können die Kasse wechseln (TK, AOK, Barmer, DAK…), aber die Preisunterschiede sind gering." },
        { type: "h2", text: "PKV in einem Absatz" },
        { type: "p", text: "Prämien werden pro Person berechnet, basierend auf Alter und Gesundheit bei Vertragsabschluss. Junge, alleinstehende Gutverdiener zahlen oft weniger als in der GKV. Familien sind in der PKV fast nie günstiger — jedes Familienmitglied hat eine eigene Prämie." },
        { type: "h2", text: "Die Faustregel" },
        { type: "ul", items: ["Angestellte unter 69.300 €/Jahr → GKV, keine Wahl", "Angestellte über der Grenze, alleinstehend, gesund, unter 35 → PKV kann sich lohnen", "Mit Partner und Kindern → GKV ist fast immer die bessere langfristige Wahl", "Freiberufler und Selbstständige → gemeinsam mit uns durchrechnen; das Ergebnis ändert sich mit dem Einkommensverlauf"] },
      ],
    ),
    tr: t(
      "Kamu mu özel mi sağlık sigortası: ailenize gerçekten hangisi uyar",
      "Gesetzlich mi privat mı? Bu karar yıllarca sizinle kalır ve geri dönmesi zordur. Kimin nerede kazandığının sade bir anlatımı.",
      "Ahşap bir masada Alman sağlık sigortası kartı ve stetoskop",
      [
        { type: "p", text: "Almanya'nın sağlık sistemi iki paralel rayda yürür: kamu sigortası (GKV) ve özel sigorta (PKV). Yeni gelenlerin çoğu varsayılan olarak GKV'ye girer — genellikle doğru karar, ama her zaman değil." },
        { type: "h2", text: "Tek paragrafta GKV" },
        { type: "p", text: "Katkı payı brüt maaşınızın sabit bir oranıdır (yaklaşık %14,6 + küçük Zusatzbeitrag) ve işvereninizle paylaşılır. Kazanç sağlamayan eşiniz ve çocuklarınız ücretsiz sigortalıdır. Kasa değiştirebilirsiniz (TK, AOK, Barmer, DAK…) ama fiyat farkı azdır." },
        { type: "h2", text: "Tek paragrafta PKV" },
        { type: "p", text: "Primler kişi başına, sözleşme anındaki yaş ve sağlık durumuna göre hesaplanır. Genç, bekar, yüksek gelirli kişiler çoğu zaman GKV'den daha az öder. Aileler PKV'de neredeyse hiç daha ucuz değildir — her fert ayrı primi olur." },
        { type: "h2", text: "Temel kural" },
        { type: "ul", items: ["Yıllık 69.300 €'nun altındaki çalışanlar → GKV, seçenek yok", "Bu eşiğin üzerinde, bekar, sağlıklı, 35 altı → PKV değerli olabilir", "Eş ve çocuklu herkes → GKV neredeyse her zaman daha iyi uzun vadeli seçim", "Serbest meslek ve kendi işinde çalışanlar → bizimle hesaplayın; cevap gelir dalgalanmasıyla değişir"] },
      ],
    ),
    ar: t(
      "التأمين الصحي العام مقابل الخاص: أيهما يناسب عائلتك فعلًا",
      "gesetzlich أم privat؟ قرار يرافقك سنوات ويصعب التراجع عنه. إليك النسخة المبسّطة عن أين يوفر كل نوع.",
      "بطاقة تأمين صحي ألمانية على مكتب خشبي بجانب سماعة طبيب",
      [
        { type: "p", text: "يعمل النظام الصحي الألماني على مسارَين متوازيَين: التأمين العام (GKV) والتأمين الخاص (PKV). معظم القادمين الجدد ينتهون تلقائيًا في GKV — وهذا في الغالب القرار الصحيح، لكن ليس دائمًا." },
        { type: "h2", text: "GKV باختصار" },
        { type: "p", text: "الاشتراكات نسبة ثابتة من دخلك الإجمالي (حوالي 14.6٪ + Zusatzbeitrag صغيرة)، تُقسم مع صاحب العمل. زوجك غير العامل وأطفالك مؤمّنون مجانًا معك. يمكنك تغيير الصندوق (TK, AOK, Barmer, DAK…) لكن فروق الأسعار صغيرة." },
        { type: "h2", text: "PKV باختصار" },
        { type: "p", text: "تُحسب الأقساط لكل فرد على أساس العمر والحالة الصحية عند التوقيع. الشباب العزّاب ذوو الدخل العالي كثيرًا ما يدفعون أقل من GKV. العائلات لا تكون في PKV أرخص تقريبًا أبدًا لأن لكل فرد قسطه." },
        { type: "h2", text: "القاعدة العامة" },
        { type: "ul", items: ["الموظفون بدخل أقل من 69,300 €/سنة → GKV، لا اختيار", "الموظفون فوق العتبة، عزّاب، أصحاء، تحت 35 → PKV قد يستحق", "من له شريك وأطفال → GKV هي الخيار الأفضل بعيد المدى في الغالب", "المستقلون وأصحاب الأعمال الحرة → احسبها معنا؛ الجواب يتغير مع تقلّب الدخل"] },
      ],
    ),
  },

  "reading-a-german-rental-contract": {
    de: t(
      "Einen deutschen Mietvertrag ohne Anwalt verstehen",
      "Kaltmiete, Nebenkosten, Staffelmiete, Kündigungsfrist — eine kurze Anleitung zu den sechs Klauseln, die im Mietvertrag wirklich zählen.",
      "Ein junges Paar prüft einen Mietvertrag in einer hellen Berliner Wohnung",
      [
        { type: "p", text: "Ein deutscher Mietvertrag kann 20 Seiten dichtes Juristendeutsch sein. Aber fast jeder Streit, bei dem wir helfen, dreht sich um dieselben sechs Klauseln. Lesen Sie diese sorgfältig — der Rest ist Standard." },
        { type: "h2", text: "1. Kaltmiete vs. Warmmiete" },
        { type: "p", text: "Kaltmiete ist die reine Wohnungsmiete. Warmmiete enthält zusätzlich die Nebenkosten (Betriebskosten und Nebenkosten des Gebäudes). Nur die Warmmiete zeigt, was monatlich vom Konto abgeht — fragen Sie immer, welchen Betrag Sie sehen." },
        { type: "h2", text: "2. Staffelmiete oder Indexmiete" },
        { type: "p", text: "Eine Staffelmiete steigt zu festgelegten Terminen um einen festen Betrag. Eine Indexmiete steigt mit der Inflation. Fehlt beides, darf die Miete nur in engen gesetzlichen Fällen steigen. Prüfen Sie, welchen Typ Sie unterschreiben." },
        { type: "h2", text: "3. Kaution" },
        { type: "p", text: "Gesetzlich auf drei Nettokaltmieten begrenzt. Muss auf einem separaten, verzinsten Konto liegen und innerhalb von sechs Monaten nach Auszug zurückgezahlt werden (abzüglich dokumentierter Schäden)." },
        { type: "h2", text: "4. Kündigungsfrist" },
        { type: "p", text: "Bei unbefristeten Verträgen können Mieter immer mit drei Monaten kündigen. Für den Vermieter wachsen die Fristen mit der Mietdauer. Klauseln, die Sie als Mieter länger binden, sind meist unwirksam." },
        { type: "h2", text: "5. Schönheitsreparaturen" },
        { type: "p", text: "Kein Punkt wird häufiger vor Gericht verhandelt. Die meisten starren Fristenpläne (\"alle 3 Jahre streichen\") sind unwirksam. Nicht bei Auszug panisch werden — wir prüfen Ihre konkrete Formulierung." },
        { type: "h2", text: "6. Untermiete und Anmeldung" },
        { type: "p", text: "Sie haben ein gesetzliches Recht auf Anmeldung an der Vertragsadresse. Wenn ein Vermieter die Wohnungsgeberbestätigung verweigert, ist das ein Alarmsignal — Finger weg." },
      ],
    ),
    tr: t(
      "Almanca kira sözleşmesini avukat olmadan okumak",
      "Kaltmiete, Nebenkosten, Staffelmiete, Kündigungsfrist — bir Mietvertrag'da gerçekten önemli olan altı maddenin kısa rehberi.",
      "Berlin'de aydınlık bir dairede kira sözleşmesi okuyan genç bir çift",
      [
        { type: "p", text: "Bir Alman Mietvertrag 20 sayfa yoğun hukuk Almancası olabilir. Ama yardım ettiğimiz hemen her uyuşmazlık aynı altı madde etrafında döner. Bunları dikkatle okuyun — geri kalan standart." },
        { type: "h2", text: "1. Kaltmiete vs Warmmiete" },
        { type: "p", text: "Kaltmiete sadece dairenin kirasıdır. Warmmiete buna Nebenkosten (aidat ve bina giderleri) eklenmiş halidir. Aylık ne çıkacağını sadece Warmmiete gösterir — her zaman hangi rakamı verdiklerini sorun." },
        { type: "h2", text: "2. Staffelmiete veya Indexmiete" },
        { type: "p", text: "Staffelmiete belirli tarihlerde sabit miktarda artar. Indexmiete enflasyona göre artar. Hiçbiri yoksa kira ancak dar yasal koşullarda artabilir. Hangi tür imzaladığınıza bakın." },
        { type: "h2", text: "3. Kaution (depozito)" },
        { type: "p", text: "Yasa ile en fazla üç aylık net kira ile sınırlıdır. Ayrı, faizli bir hesapta tutulmak ve taşındıktan sonra altı ay içinde (belgeli hasar düşülerek) iade edilmek zorundadır." },
        { type: "h2", text: "4. Kündigungsfrist (fesih süresi)" },
        { type: "p", text: "Süresiz sözleşmelerde kiracı her zaman üç ay önceden bildirim yapabilir. Kiracıyı daha uzun süre bağlayan maddeler genellikle geçersizdir." },
        { type: "h2", text: "5. Schönheitsreparaturen" },
        { type: "p", text: "Alman kira hukukunda en çok davaya konu olan madde. Katı takvimler (\"3 yılda bir boyayın\") çoğu zaman geçersizdir. Çıkışta paniğe kapılmayın — sözleşmenizdeki tam ifadeyi biz inceleriz." },
        { type: "h2", text: "6. Untermiete ve Anmeldung" },
        { type: "p", text: "Sözleşme adresinizde Anmeldung yapmak yasal hakkınızdır. Ev sahibi Wohnungsgeberbestätigung imzalamayı reddediyorsa bu bir uyarı işaretidir — o daireden uzak durun." },
      ],
    ),
    ar: t(
      "قراءة عقد إيجار ألماني دون محامٍ",
      "Kaltmiete وNebenkosten وStaffelmiete وKündigungsfrist — دليل قصير للبنود الستة التي تهم فعلًا في عقد الإيجار.",
      "زوجان شابان يراجعان عقد إيجار في شقة مضيئة في برلين",
      [
        { type: "p", text: "قد يكون عقد الإيجار الألماني 20 صفحة من الألمانية القانونية الكثيفة. لكن كل نزاع نساعد فيه تقريبًا يعود إلى البنود الستة نفسها. اقرأها بعناية — الباقي مجرد قوالب." },
        { type: "h2", text: "1. Kaltmiete مقابل Warmmiete" },
        { type: "p", text: "Kaltmiete هي إيجار الشقة فقط. Warmmiete تضيف Nebenkosten (خدمات وتكاليف المبنى). Warmmiete وحدها تخبرك بما يُخصم شهريًا — اسأل دائمًا عن أي رقم يُذكر لك." },
        { type: "h2", text: "2. Staffelmiete أو Indexmiete" },
        { type: "p", text: "Staffelmiete ترتفع بمبلغ ثابت في تواريخ محددة. Indexmiete ترتفع مع التضخم. إذا لم يوجد أيّ منهما لا يجوز رفع الإيجار إلا في حالات قانونية ضيقة. تحقق من نوع عقدك." },
        { type: "h2", text: "3. Kaution (التأمين)" },
        { type: "p", text: "محدد قانونًا بثلاثة أشهر من Kaltmiete كحد أقصى. يجب أن يوضع في حساب منفصل يحمل فائدة، ويُعاد خلال ستة أشهر من مغادرة الشقة (مع خصم الأضرار الموثقة)." },
        { type: "h2", text: "4. Kündigungsfrist (مهلة الإخطار)" },
        { type: "p", text: "في العقود المفتوحة يستطيع المستأجر دائمًا الإخطار قبل ثلاثة أشهر. مهلة إخطار المؤجر تطول مع طول الإيجار. أي بند يلزم المستأجر بمدة أطول عادةً باطل." },
        { type: "h2", text: "5. Schönheitsreparaturen" },
        { type: "p", text: "البند الأكثر تقاضيًا في قانون الإيجار الألماني. معظم الجداول الصارمة (\"دهان كل 3 سنوات\") غير قابلة للتنفيذ. لا تُصب بالذعر عند المغادرة — نراجع الصياغة الخاصة بعقدك." },
        { type: "h2", text: "6. Untermiete وAnmeldung" },
        { type: "p", text: "من حقك القانوني تسجيل Anmeldung على عنوان العقد. إذا رفض المالك التوقيع على Wohnungsgeberbestätigung فهذه إشارة تحذير — ابتعد عن الشقة." },
      ],
    ),
  },

  "steuererklaerung-first-time": {
    de: t(
      "Ihre erste Steuererklärung: was Sie wirklich zurückholen können",
      "Die meisten Angestellten in Deutschland bekommen beim ersten Mal rund 1.100 € zurück. So machen Sie es ruhig — ohne Steuerberater.",
      "Eine Person füllt eine deutsche Steuererklärung mit Belegen und Taschenrechner aus",
      [
        { type: "p", text: "Deutschland erstattet zu viel gezahlte Steuern nicht automatisch. Sie müssen eine Steuererklärung abgeben — und die durchschnittliche Rückzahlung für Angestellte liegt bei etwa 1.100 €. Für die meisten Angestellten ist die Abgabe freiwillig, und Sie haben vier Jahre Zeit, rückwirkend einzureichen." },
        { type: "h2", text: "Kategorien, die wirklich etwas bringen" },
        { type: "ul", items: ["Werbungskosten: Pendlerpauschale (0,30 €/km, 0,38 € ab 20 km), Homeoffice, Arbeitsmittel", "Sonderausgaben: private Altersvorsorge, Kirchensteuer, Spenden", "Außergewöhnliche Belastungen: Krankheitskosten über der zumutbaren Belastung", "Handwerkerkosten: 20 % der Lohnkosten bei Handwerkerleistungen, bis 1.200 €/Jahr", "Haushaltsnahe Dienstleistungen: Reinigung, Kinderbetreuung zu Hause, Pflegeleistungen"] },
        { type: "h2", text: "Was Sie brauchen" },
        { type: "p", text: "Ihre Lohnsteuerbescheinigung (Jahres-Gehaltsabrechnung), Ihre Steuer-ID und ungefähre Beträge zu den obigen Kategorien. Belege müssen nicht mitgeschickt werden — Sie bewahren sie auf und legen sie nur auf Aufforderung des Finanzamts vor." },
        { type: "h2", text: "Fristen" },
        { type: "p", text: "Freiwillige Abgabepflichtige haben vier Jahre. Pflichtabgeber (Selbstständige, Ehepaare mit III/V, mehrere Arbeitgeber) müssen bis zum 31. Juli des Folgejahres abgeben — verlängert bei Beauftragung eines Steuerberaters." },
      ],
    ),
    tr: t(
      "İlk Steuererklärung'unuz: gerçekten neyi geri alabilirsiniz",
      "Almanya'da çalışanların çoğu ilk kez verdiklerinde yaklaşık 1.100 € iade alıyor. Muhasebeci olmadan sakin bir şekilde nasıl yapılır?",
      "Fişleri ve hesap makinesiyle Alman vergi beyannamesi dolduran bir kişi",
      [
        { type: "p", text: "Almanya fazla topladığı vergiyi otomatik olarak iade etmez. Geri almak için Steuererklärung vermeniz gerekir — çalışanlar için ortalama iade yaklaşık 1.100 €'dur. Çoğu çalışan için beyan isteğe bağlı ve dört yıl geriye dönük başvurabilirsiniz." },
        { type: "h2", text: "Gerçekten fark yaratan kalemler" },
        { type: "ul", items: ["Werbungskosten: yol (km başına 0,30 €, 20 km sonrası 0,38 €), ev ofisi, iş ekipmanı", "Sonderausgaben: özel emeklilik katkıları, kilise vergisi, bağışlar", "Außergewöhnliche Belastungen: makul eşiğin üstündeki sağlık giderleri", "Handwerkerkosten: ev tamiratı işçilik ücretinin %20'si, yılda 1.200 €'ya kadar", "Haushaltsnahe Dienstleistungen: temizlikçi, evde çocuk bakımı, yaşlı bakımı ziyaretleri"] },
        { type: "h2", text: "Neye ihtiyacınız var" },
        { type: "p", text: "Lohnsteuerbescheinigung (yıl sonu maaş özeti), vergi kimliğiniz ve yukarıdaki kalemler için yaklaşık rakamlar. Beyanla birlikte fişleri göndermenize gerek yok — saklarsınız, Finanzamt isterse gösterirsiniz." },
        { type: "h2", text: "Süreler" },
        { type: "p", text: "İsteğe bağlı beyan verenler dört yıl süreye sahiptir. Zorunlu olanlar (serbest meslek, III/V sınıfındaki çift maaşlı çiftler, birden fazla işveren) ertesi yılın 31 Temmuz'una kadar vermek zorundadır — Steuerberater kullanılırsa uzar." },
      ],
    ),
    ar: t(
      "أول إقرار ضريبي لك: ما يمكنك استرداده فعلًا",
      "معظم الموظفين في ألمانيا يستردون نحو 1,100 € في أول مرة يقدّمون فيها الإقرار. إليك الطريقة الهادئة للقيام بذلك دون محاسب.",
      "شخص يملأ إقرارًا ضريبيًا ألمانيًا مع فواتير وآلة حاسبة",
      [
        { type: "p", text: "ألمانيا لا تعيد تلقائيًا الضريبة التي تحصّلها زائدة. لاستردادها عليك تقديم Steuererklärung — ومتوسط الاسترداد للموظفين نحو 1,100 €. تقديم الإقرار اختياري لمعظم الموظفين، ولديك أربع سنوات للنظر إلى الوراء." },
        { type: "h2", text: "الأصناف التي تُحدث فرقًا فعلًا" },
        { type: "ul", items: ["Werbungskosten: تنقّل العمل (0.30 €/كم، 0.38 € بعد 20 كم)، مكتب منزلي، معدات عمل", "Sonderausgaben: مساهمات تقاعد خاصة، ضريبة الكنيسة، تبرعات", "Außergewöhnliche Belastungen: النفقات الطبية فوق الحد المعقول", "Handwerkerkosten: 20٪ من أجور صيانة المنزل حتى 1,200 €/سنة", "Haushaltsnahe Dienstleistungen: عمّال نظافة، رعاية أطفال في المنزل، زيارات رعاية المسنين"] },
        { type: "h2", text: "ما تحتاجه" },
        { type: "p", text: "Lohnsteuerbescheinigung (كشف الراتب السنوي)، رقمك الضريبي، وأرقام تقريبية للأصناف أعلاه. لا حاجة لإرسال الفواتير مع الإقرار — تحتفظ بها وتقدمها فقط إن طلبتها Finanzamt." },
        { type: "h2", text: "المواعيد النهائية" },
        { type: "p", text: "المقدّمون اختياريًا لديهم أربع سنوات. المُلزمون بالتقديم (المستقلون، الأزواج مزدوجو الدخل بفئتي III/V، من لديهم أكثر من صاحب عمل) عليهم التقديم حتى 31 يوليو من العام التالي — تُمدَّد المهلة عند الاستعانة بـ Steuerberater." },
      ],
    ),
  },

  "kita-place-and-school-enrolment": {
    de: t(
      "Einen Kita-Platz bekommen — und die richtige Schule anmelden",
      "Kita-Wartelisten beginnen, bevor Ihr Kind geboren ist. Die Schulanmeldung hat eine harte Frist. Was in jeder Stadt zu tun ist und was bei einem verpassten Termin geschieht.",
      "Kinder gehen mit Rucksäcken im Herbst zur Kita",
      [
        { type: "p", text: "Jedes Kind in Deutschland hat ab dem ersten Geburtstag einen Rechtsanspruch auf einen Kita-Platz — aber der Anspruch bringt keinen einfachen Platz mit sich. In Berlin, Hamburg, München und Frankfurt bewerben Familien sich regelmäßig bei 15–20 Kitas und starten das Jahr trotzdem ohne Platz." },
        { type: "h2", text: "Das Kita-Gutschein-System" },
        { type: "p", text: "Die meisten Bundesländer haben ein Gutscheinsystem. Sie beantragen beim Jugendamt einen Kita-Gutschein mit den Stunden, die Sie brauchen (z. B. 7 h/Tag), und nutzen ihn dann bei jeder Kita mit freiem Platz. Berlins Kita-Navigator und Hamburgs Kita-Datenbank listen freie Plätze öffentlich — wir überwachen sie für Sie." },
        { type: "h2", text: "Wenn nichts kommt" },
        { type: "p", text: "Der Rechtsanspruch ist durchsetzbar. Kann das Jugendamt keinen Platz in erreichbarer Nähe anbieten, können Sie Kostenerstattung für eine Tagesmutter oder Privat-Kita verlangen. Nur wenige Familien klagen tatsächlich — schon der schriftliche Antrag führt meist innerhalb von Wochen zum Platz." },
        { type: "h2", text: "Anmeldung an der Grundschule" },
        { type: "p", text: "Kinder, die zwischen dem 1. Juli und dem 30. Juni des folgenden Schuljahres geboren wurden, müssen zwischen September und Dezember des Vorjahres an der zugewiesenen Grundschule angemeldet werden. Fristen variieren je Bundesland — wer sie verpasst, verliert die Schulwahl." },
      ],
    ),
    tr: t(
      "Bir Kita yeri almak — ve doğru okula kayıt yaptırmak",
      "Kita bekleme listeleri bebeğiniz doğmadan başlıyor. Okul kaydında ise net bir süre var. Her şehirde ne yapılır ve süreyi kaçırırsanız ne olur?",
      "Sonbaharda sırt çantalarıyla Alman Kita'sına yürüyen çocuklar",
      [
        { type: "p", text: "Almanya'daki her çocuğun bir yaşından itibaren yasal olarak bir Kita yeri hakkı vardır — ama hak, kolay bir yer anlamına gelmez. Berlin, Hamburg, Münih ve Frankfurt'ta aileler 15–20 Kita'ya başvurup yine de yılın başında yer bulamadan başlıyor." },
        { type: "h2", text: "Kita-Gutschein sistemi" },
        { type: "p", text: "Çoğu eyalet kupon sistemi işletir. Yerel Jugendamt'a ihtiyacınız olan saatleri (örneğin günde 7 saat) belirten bir Kita-Gutschein başvurusu yapar, sonra bu kuponla yeri açık olan herhangi bir Kita'ya girersiniz. Berlin'in Kita-Navigator'ı ve Hamburg'un Kita-Datenbank'ı boşlukları herkese açık listeler — biz sizin için izliyoruz." },
        { type: "h2", text: "Hiç yer çıkmazsa" },
        { type: "p", text: "Rechtsanspruch (yasal hak) uygulanabilir. Jugendamt makul mesafede bir yer sunamıyorsa Tagesmutter veya özel Kita için tazminat talep edebilirsiniz. Aileler nadiren mahkemeye gider — sadece yazılı talep genellikle haftalar içinde yer üretir." },
        { type: "h2", text: "Grundschule kaydı" },
        { type: "p", text: "1 Temmuz ile ertesi öğretim yılının 30 Haziran'ı arasında doğan çocuklar, okula başlamadan bir yıl önceki Eylül ile Aralık arasında atanmış Grundschule'ye kayıt ettirilmelidir. Süreler eyalete göre değişir — kaçırırsanız hangi okula gideceği konusundaki seçim hakkınızı kaybedebilirsiniz." },
      ],
    ),
    ar: t(
      "الحصول على مقعد في Kita — والتسجيل في المدرسة المناسبة",
      "قوائم انتظار Kita تبدأ قبل ولادة طفلك. وتسجيل المدرسة له موعد نهائي صارم. إليك ما تفعله في كل مدينة وماذا لو فاتك الموعد.",
      "أطفال يمشون نحو حضانة ألمانية بحقائبهم في الخريف",
      [
        { type: "p", text: "لكل طفل في ألمانيا حق قانوني في مقعد Kita من سن الواحدة — لكن الحق لا يعني مقعدًا سهلًا. في برلين وهامبورغ وميونخ وفرانكفورت تتقدم العائلات عادةً إلى 15–20 حضانة وتبدأ العام دون مقعد." },
        { type: "h2", text: "نظام Kita-Gutschein" },
        { type: "p", text: "معظم الولايات تستخدم نظام قسائم. تتقدم إلى Jugendamt المحلي بطلب Kita-Gutschein محدّدًا الساعات المطلوبة (مثلاً 7 ساعات يوميًا)، ثم تستخدم القسيمة في أي Kita بها مقعد شاغر. Kita-Navigator في برلين وKita-Datenbank في هامبورغ يعرضان المقاعد الشاغرة علنًا — نراقبها بدلًا عنك." },
        { type: "h2", text: "إن لم يظهر شيء" },
        { type: "p", text: "الحق القانوني قابل للتنفيذ. إذا لم يستطع Jugendamt تقديم مقعد على مسافة معقولة يحق لك المطالبة بتعويض عن Tagesmutter أو حضانة خاصة. قلّة قليلة من العائلات تلجأ فعلًا للقضاء — مجرد الطلب المكتوب يُثمر عادةً عن مقعد خلال أسابيع." },
        { type: "h2", text: "تسجيل Grundschule" },
        { type: "p", text: "الأطفال المولودون بين 1 يوليو و30 يونيو من العام الدراسي التالي يجب تسجيلهم في المدرسة الابتدائية المخصصة بين سبتمبر وديسمبر من العام السابق للالتحاق. المواعيد تختلف بين الولايات — تفويتها قد يفقدك حق اختيار المدرسة." },
      ],
    ),
  },

  "german-citizenship-2026": {
    de: t(
      "Die neuen Einbürgerungsregeln — wer heute nach 3 oder 5 Jahren Anspruch hat",
      "Die Reform von 2024 ist inzwischen gefestigt. Doppelte Staatsbürgerschaft ist erlaubt, die Aufenthaltsdauer ist kürzer und die Integrationskriterien sind klarer. Der aktuelle Stand.",
      "Hände halten einen deutschen Reisepass und eine Einbürgerungsurkunde",
      [
        { type: "p", text: "Die Reform des Staatsangehörigkeitsgesetzes vom Juni 2024 ist inzwischen im Alltag jeder Einbürgerungsbehörde angekommen. Zwei Jahre danach ist das Bild deutlich klarer als am ersten Tag." },
        { type: "h2", text: "Der Standardweg: 5 Jahre" },
        { type: "p", text: "Sie können nach fünf Jahren rechtmäßigen Aufenthalts die Einbürgerung beantragen, wenn Sie Ihren Lebensunterhalt (auch für die Familie) selbst sichern, B1-Deutsch nachweisen, den Einbürgerungstest bestehen und keine schweren Straftaten begangen haben. Doppelte Staatsbürgerschaft ist heute erlaubt — Sie müssen die Ursprungsstaatsangehörigkeit nicht mehr aufgeben." },
        { type: "h2", text: "Der Turboweg: 3 Jahre" },
        { type: "p", text: "Besondere Integrationsleistungen verkürzen die Frist auf drei Jahre: C1-Deutsch, herausragende berufliche oder akademische Leistungen oder anhaltendes ehrenamtliches Engagement. Diese Route wird tatsächlich gewährt — wir haben Klienten 2025 und 2026 dabei begleitet." },
        { type: "h2", text: "Was Sie früh vorbereiten" },
        { type: "ul", items: ["Durchgehende Meldebescheinigung über fünf (bzw. drei) Jahre", "Sprachzertifikat (B1 oder C1) einer anerkannten Stelle", "Bestehensurkunde des Einbürgerungstests", "Steuer- und Rentenverlauf als Nachweis der Selbstständigkeit", "Führungszeugnis"] },
        { type: "h2", text: "Realistische Bearbeitungszeiten" },
        { type: "p", text: "Nach Einreichung dauern Entscheidungen aktuell 6–18 Monate, je nach Stadt. Berlin und Hamburg sind am langsamsten; kleinere Bundesländer deutlich schneller. Beginnen Sie mit dem Sammeln der Dokumente ein Jahr vor der geplanten Antragstellung." },
      ],
    ),
    tr: t(
      "Yeni Alman vatandaşlığı kuralları — 3 veya 5 yılda kimin hakkı var",
      "2024 vatandaşlık reformu artık yerleşti. Çifte vatandaşlık serbest, oturum süresi kısaldı, entegrasyon kriterleri netleşti. Mevcut manzara.",
      "Ahşap bir masada Alman pasaportu ve vatandaşlık belgesi tutan eller",
      [
        { type: "p", text: "Haziran 2024'te yürürlüğe giren Staatsangehörigkeitsgesetz reformu artık her Einbürgerungsbehörde'nin günlük işine gömülü durumda. İki yıl sonra tablo ilk gündekinden çok daha net." },
        { type: "h2", text: "Standart yol: 5 yıl" },
        { type: "p", text: "Beş yıllık yasal ikametten sonra vatandaşlığa başvurabilirsiniz: kendinizi ve ailenizi geçindiriyor olmanız, B1 Almanca, Einbürgerungstest'i geçmiş olmanız ve ağır bir sabıka bulunmaması gerekir. Çifte vatandaşlık artık serbest — mevcut vatandaşlığınızdan feragat etmenize gerek yok." },
        { type: "h2", text: "Hızlı yol: 3 yıl" },
        { type: "p", text: "Özel entegrasyon başarıları süreyi üç yıla indirir: C1 Almanca, güçlü meslek/akademik performans, ya da sürekli gönüllü çalışma. Bu yol gerçekten veriliyor — 2025 ve 2026'da müvekkilleri bu şekilde tamamladık." },
        { type: "h2", text: "Erken hazırlanacaklar" },
        { type: "ul", items: ["Beş (veya üç) yılı kesintisiz gösteren Meldebescheinigung", "Tanınmış bir sağlayıcıdan dil sertifikası (B1 veya C1)", "Einbürgerungstest başarı belgesi", "Öz-yeterliliği kanıtlayan vergi ve emeklilik kaydı", "Führungszeugnis (sabıka kaydı)"] },
        { type: "h2", text: "Gerçekçi süreler" },
        { type: "p", text: "Başvuru sonrası kararlar şu an şehre göre 6–18 ay alıyor. Berlin ve Hamburg en yavaşları; küçük eyaletler çok daha hızlı. Belgeleri başvurudan bir yıl önce toplamaya başlayın." },
      ],
    ),
    ar: t(
      "قواعد الجنسية الألمانية الجديدة — من يستحق بعد 3 أو 5 سنوات",
      "استقر إصلاح 2024 للجنسية. الجنسية المزدوجة مسموحة، ومدة الإقامة أقصر، ومعايير الاندماج أوضح. إليك المشهد الحالي.",
      "يدان تحملان جواز سفر ألمانيًا وشهادة تجنس على مكتب خشبي",
      [
        { type: "p", text: "إصلاح Staatsangehörigkeitsgesetz الذي دخل حيّز التنفيذ في يونيو 2024 بات جزءًا يوميًا من عمل كل Einbürgerungsbehörde. بعد عامين أصبحت الصورة أوضح كثيرًا مقارنة باليوم الأول." },
        { type: "h2", text: "المسار القياسي: 5 سنوات" },
        { type: "p", text: "يمكن التقدم للجنسية الألمانية بعد خمس سنوات من الإقامة القانونية إذا كنت تعيل نفسك وأسرتك، ولديك ألمانية B1، واجتزت Einbürgerungstest، وليس لديك سوابق جنائية جسيمة. الجنسية المزدوجة الآن مسموحة — لم يعد عليك التخلي عن جنسيتك الأصلية." },
        { type: "h2", text: "المسار السريع: 3 سنوات" },
        { type: "p", text: "إنجازات اندماج خاصة تختصر المدة إلى ثلاث سنوات: ألمانية C1، أداء مهني أو أكاديمي متميز، أو عمل تطوعي مستمر. هذا المسار يُمنَح فعلًا — ساعدنا عملاء على إتمامه في 2025 و2026." },
        { type: "h2", text: "ما تحضّره مبكرًا" },
        { type: "ul", items: ["Meldebescheinigung مستمرة تُثبت خمس (أو ثلاث) سنوات دون انقطاع", "شهادة لغة (B1 أو C1) من جهة معتمدة", "شهادة اجتياز Einbürgerungstest", "سجل ضريبي وتقاعدي يُثبت الاكتفاء الذاتي", "Führungszeugnis (شهادة عدم محكومية)"] },
        { type: "h2", text: "مواعيد واقعية" },
        { type: "p", text: "بعد التقديم تستغرق القرارات حاليًا 6–18 شهرًا حسب المدينة. برلين وهامبورغ الأبطأ؛ الولايات الأصغر أسرع بكثير. ابدأ بجمع الوثائق قبل عام من تقديم الطلب." },
      ],
    ),
  },
};

/** Merge the translations table into an existing translations record on a post. */
export function withTranslations(
  slug: string,
  existing: Record<string, PostTranslation> | undefined,
): Record<string, PostTranslation> | undefined {
  const extra = BLOG_TRANSLATIONS[slug];
  if (!extra) return existing;
  return { ...(existing ?? {}), ...extra };
}
