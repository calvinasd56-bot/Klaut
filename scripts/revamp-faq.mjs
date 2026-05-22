// One-shot revamp: replace the FAQ array in faq.html + id/faq.html with the
// new business-model-aligned Q&A (Klaut = customization layer, Compass = product,
// workforce intelligence positioning, honest pre-revenue state).
//
// Each language's FAQ is written independently — they cover the same topics but
// are not literal translations. Per founder direction (feedback_klaut_translations.md),
// the two versions are intentionally allowed to diverge.
import { readFileSync, writeFileSync } from 'node:fs';

const FAQ_EN = [
  // ---------------- fit (4) ----------------
  {
    cat: 'fit',
    q: "What is Klaut, and what is Compass — are they the same thing?",
    a: `<p>No. They are two layers of the same stack.</p>
        <p><strong>Compass is the product</strong> — a workforce intelligence system that recognises the person behind every piece of work. It observes how your team operates in the systems they already use, corrects mistakes in the moment, generates personalised micro-lessons from observed gaps, and reports development progress through three privacy-bounded views: employee, manager, HR.</p>
        <p><strong>Klaut is the company that customises and deploys it.</strong> Compass runs standalone; Klaut configures it for your stack, writes the integrations, builds the dashboards your executives will actually read, and remains on call as the deployment matures. The structural reference is Palantir's deployed-engineer model — adapted for mid-market scale.</p>`
  },
  {
    cat: 'fit',
    q: "Who is Compass for, and who should not buy it?",
    a: `<p>Compass is for organisations that need AI to deliver productivity <strong>without displacing the workforce</strong>. That increasingly means: Indonesian enterprises navigating the social cost of layoffs, EU companies under the AI Act's worker-impact obligations, and US companies whose change-resistance comes from organised labour or internal culture rather than from technology.</p>
        <p>If your AI strategy is <em>"reduce the team by 30%"</em>, Klaut is the wrong firm. We'd rather tell you that on the first call than spend a quarter pretending otherwise. We've structurally designed the product so that revenue does not depend on headcount reduction.</p>`
  },
  {
    cat: 'fit',
    q: "We just want an AI chatbot, not a workforce thing. Are we a fit?",
    a: `<p>Probably not, and we'd tell you on the first call.</p>
        <p>Plenty of vendors will sell you a chatbot. Compass is for the company that already has — or is about to deploy — AI on top of people, and wants the <em>people</em> to compound in capability as the AI gets smarter. If you only need a customer-facing chatbot, a generic implementation partner will be faster and cheaper than Klaut.</p>`
  },
  {
    cat: 'fit',
    q: "We already use Lattice / Culture Amp / Cresta / Observe.AI. What's different?",
    a: `<p>Each of those products owns one slice of the loop. <strong>Lattice and Culture Amp</strong> handle performance management. <strong>Cresta and Observe.AI</strong> handle conversation intelligence. <strong>LMS platforms</strong> handle formal training.</p>
        <p>None of them close the loop from <em>observed mistake → personalised correction → micro-lesson → re-assessment</em>. None of them are architected with the <strong>privacy-bounded three-buyer alignment</strong> (employee owns their mistakes; manager sees aggregate; HR sees role-level capability) — because their existing enterprise sales motion depends on giving managers per-individual visibility, which Compass deliberately does not.</p>
        <p>The gap is positional, not feature-level. They are structurally less able to copy the position than to copy any single feature.</p>`
  },

  // ---------------- tech (5) ----------------
  {
    cat: 'tech',
    q: "How does Compass actually work, end to end?",
    a: `<p>Five steps, running continuously.</p>
        <p><strong>1. Observe</strong> — Compass connects to the work systems your team already uses (helpdesk, CRM, ticket queue) and reads the <em>work product</em>: the ticket, the response, the resolution path. Not screens. Not keystrokes.</p>
        <p><strong>2. Correct</strong> — when a mistake is identified, Compass intervenes in the moment, privately, in a tone calibrated for development rather than reprimand.</p>
        <p><strong>3. Educate</strong> — from accumulated correction data, Compass generates 5-to-10-minute micro-lessons targeting that individual's specific failure modes.</p>
        <p><strong>4. Assess</strong> — periodically, Compass tests whether lessons have been internalised, not via quizzes but by watching real work over time.</p>
        <p><strong>5. Report</strong> — monthly, three separate views: a personal report card for the employee, an aggregate view for the manager, a role/function view for HR.</p>
        <p>The longer the loop runs, the better the personalisation. The longer it runs, the richer the per-role mistake taxonomy Compass develops becomes — and that taxonomy is the proprietary asset competitors cannot easily replicate.</p>`
  },
  {
    cat: 'tech',
    q: "Does Compass record screens, capture keystrokes, or read private messages?",
    a: `<p><strong>No, no, and no.</strong></p>
        <p>Compass reads the <em>work product</em> through your existing system APIs — the ticket in your helpdesk, the response in your CRM, the conversation in your service platform. We do not install screen recorders. We do not capture keystrokes. We do not have access to private channels (DMs, personal email, anything outside the work systems you explicitly connect).</p>
        <p>Surveillance is the opposite of what Compass is engineered for. If your evaluation criteria require monitoring at that depth, we're not the right product.</p>`
  },
  {
    cat: 'tech',
    q: "Which work systems does Compass plug into today?",
    a: `<p>Initial release targets the customer-service stack: <strong>Zendesk, Freshdesk, Intercom, Salesforce Service Cloud</strong>, plus the Indonesian CS platforms our anchor partner operates inside. CRM and ticketing integrations expand from there.</p>
        <p>If your stack isn't on the list, the Foundation engagement maps integration cost before you commit to anything — you won't discover a missing connector in week 5.</p>`
  },
  {
    cat: 'tech',
    q: "Customer service is your first vertical. When do sales, engineering, operations land?",
    a: `<p>Order is set by where work product is <em>structured enough</em> for Compass to observe reliably — not by where the demand is loudest.</p>
        <p><strong>Customer Service</strong> is first because performance signals are unambiguous (handle time, resolution, CSAT, escalation rate) and the cultural friction to observing individual work is lowest. <strong>MVP target: August 2026. First pilot client: October 2026.</strong></p>
        <p><strong>Sales</strong> is the natural second vertical (pipeline conversion, deal cycle, win rate — equally clean metrics). <strong>Support engineering</strong> and <strong>operations</strong> follow as the per-role mistake taxonomy in those domains matures. Roadmap dates beyond CS we publish only once we have closed a pilot — we'd rather under-promise than over-promise on a multi-vertical roadmap before the first one ships.</p>`
  },
  {
    cat: 'tech',
    q: "A better foundation model lands mid-deployment. Then what?",
    a: `<p>We swap it.</p>
        <p>Every Compass deployment runs through a <strong>provider-abstraction layer</strong> — Anthropic today, OpenAI tomorrow, Gemini next quarter, an open-weights model running in your VPC if that's where the eval lands. Switching is a config change, not a rewrite.</p>
        <p>The taxonomy of mistakes Compass has learned about <em>your</em> team is the proprietary asset. The underlying model is replaceable infrastructure.</p>`
  },

  // ---------------- security (3) — privacy & data ----------------
  {
    cat: 'security',
    q: "Can my manager see every mistake I make?",
    a: `<p><strong>No. The privacy architecture is the product, not a side feature.</strong></p>
        <p>Personal mistakes belong to the employee. The manager sees aggregate team capability — strengths, common gaps, training velocity — with no drill-down to any named individual. The HR view operates at role-and-function level, not person level. There is no drill-down from a manager to an individual without <strong>explicit, recorded consent</strong> from that individual.</p>
        <p>This isn't a configuration setting we let admins toggle off. It is wired into the data model. It is also why Compass aligns three buyers — CEO, HR, employee — that competing products typically split.</p>`
  },
  {
    cat: 'security',
    q: "Will our data train anyone's model — yours, or a foundation model vendor's?",
    a: `<p>No.</p>
        <p>We sign <strong>zero-retention agreements</strong> with every foundation-model provider before any data flows. If a provider cannot offer zero-retention for your account, we do not use them on your account — there are always alternatives.</p>
        <p>Klaut, the company, does not operate a model of our own that learns from your data. The per-role mistake taxonomy Compass develops is scoped to your tenant — it is never pooled across clients, sold, or used to train a shared model.</p>`
  },
  {
    cat: 'security',
    q: "EU AI Act, Indonesian PDP Law, SOC 2 — where do you stand on compliance?",
    a: `<p>Honestly: two of those are <em>architectural compliance</em>, one is operational and not yet finished.</p>
        <p><strong>EU AI Act:</strong> the privacy-bounded three-view design directly addresses worker-impact obligations. We provide the worker-impact assessment artifact the Act requires for high-risk AI systems.</p>
        <p><strong>Indonesian PDP Law (UU PDP):</strong> data residency, purpose limitation, and consent are designed into the data model — your data stays in your environment, scoped to the stated purpose.</p>
        <p><strong>SOC 2 Type II:</strong> on the operational moat list, <strong>targeted Q4 2027</strong> as part of Series A readiness. If SOC 2 attestation is a hard procurement gate today, we are not yet a fit and we'll say so on the first call.</p>`
  },

  // ---------------- pricing (3) ----------------
  {
    cat: 'pricing',
    q: "What does a Klaut engagement cost end-to-end?",
    a: `<p>Three layers, every price agreed in writing before any work starts.</p>
        <p><strong>Foundation</strong> (paid discovery and assessment): <code>$8,000–$25,000</code> depending on scope and client size. Fixed price.</p>
        <p><strong>Implementation</strong> (converting Foundation findings into a deployed system): <code>$25,000–$120,000</code> depending on integration complexity and how many functions get Compass-deployed. Fixed price.</p>
        <p><strong>Compass subscription</strong> (the recurring layer): <code>$5,000–$18,000 per month</code> at mid-market scale, per-seat per-month, tied to the number of employees Compass observes.</p>
        <p>No retainers. No hourly billing. No surprise line items at the end. If we miss the metric we agreed in Foundation, we keep working at our cost until we hit it — or refund the final payment and walk.</p>`
  },
  {
    cat: 'pricing',
    q: "Why is the Foundation discovery paid, not free?",
    a: `<p>Free discovery doesn't work for either of us.</p>
        <p>Free discovery selects for clients who haven't yet decided whether AI is real for their business — we end up doing pre-sales work for companies who never close. <strong>Paying for Foundation pre-qualifies you</strong> for the engagement that follows, and we use the money to do good diagnostic work rather than gloss over hard answers to keep you happy.</p>
        <p>About 1 in 5 Foundation clients decide not to proceed to implementation. We think that's healthy — both sides should walk away if the diagnostic doesn't support the bigger spend.</p>`
  },
  {
    cat: 'pricing',
    q: "Compass subscription — per seat? Annual? Cancellable?",
    a: `<p><strong>Per-seat per-month</strong>, billed monthly, tied to the number of employees Compass observes in the deployed function.</p>
        <p>Standard term is 12 months once implementation goes live. Cancellation terms sit in the MSA — there's no auto-renew gotcha; you re-sign or you don't.</p>
        <p><strong>Lifetime value compounds</strong> as you deploy Compass into additional functions under the same MSA — start with customer service, add sales next year, then support engineering, then operations. Per-deployment overhead amortises, so the marginal cost per added function drops over time.</p>`
  },

  // ---------------- process (3) ----------------
  {
    cat: 'process',
    q: "How do we get started — what does the first 90 days look like?",
    a: `<p>Three phases.</p>
        <p><strong>Weeks 1–2 · Foundation kickoff.</strong> We map your current AI exposure, identify the highest-leverage workforce intelligence opportunity, agree the metric we'll measure against, and scope the implementation. Deliverable: a one-page proposal you could take to any other vendor — yours to keep.</p>
        <p><strong>Weeks 3–8 · Implementation.</strong> Compass deploys into the agreed function. Integrations to your systems. Privacy architecture configured for your industry and jurisdiction. Dashboards built. We're on-site for week 1 of this phase.</p>
        <p><strong>Weeks 9–12 · Pilot run.</strong> Compass starts observing. The five-step loop runs. The first monthly reports go out to employee, manager, and HR. By day 90 you have a live deployment generating compounding value — not a pilot ending in a slide deck.</p>`
  },
  {
    cat: 'process',
    q: "Who from our team needs to be in the room?",
    a: `<p>Three people, non-negotiable.</p>
        <p><strong>One executive</strong> (CEO, COO, or function head) who can unblock procurement and security in an afternoon, not a fortnight.</p>
        <p><strong>One operational owner</strong> — the actual head of the function Compass is deploying into. Head of Customer Service for the first vertical. They co-own the metric we agreed in Foundation.</p>
        <p><strong>One IT or security lead</strong> to handle the integration to your existing systems and the privacy review against your governance regime.</p>
        <p>Without those three present and accountable, we don't take the engagement. We've learned this the expensive way.</p>`
  },
  {
    cat: 'process',
    q: "Remote or on-site? Where does Klaut work from?",
    a: `<p>Jakarta is home.</p>
        <p>We're <strong>on-site for week 1 of implementation and for the final cutover</strong>, remote in between with a 4-hour overlap on your business hours. Indonesian and Southeast Asian clients get full on-site availability throughout the engagement if needed.</p>
        <p>Global clients (Europe, US, LatAm) get monthly on-site visits, with travel included in the engagement price — no separate travel line items, no expense reports to approve afterwards.</p>`
  },

  // ---------------- after (2) — honest state + long-term ----------------
  {
    cat: 'after',
    q: "Honest question — does Klaut actually have paying clients today?",
    a: `<p><strong>No, not yet.</strong> Pre-revenue, MVP stage. We're not going to pretend otherwise.</p>
        <p>As of May 2026: 38 prospects identified, 9 active conversations, 4 qualified opportunities, 1 proposal sent, 0 contracts signed. <strong>First paying Foundation client targeted end of Q2 2026.</strong> Compass MVP targeted August 2026. First pilot client targeted October 2026. YC Summer 2027 application Q1 2027 with that pilot data in hand.</p>
        <p>If "ten reference customers in your vertical" is your minimum bar, we are not your firm yet. The right step is to come back in Q1 2027 once the first pilot case study is live, or stay in the conversation now and let us earn the deployment once Compass is real.</p>`
  },
  {
    cat: 'after',
    q: "Klaut is small. What happens to our deployment if Klaut shuts down?",
    a: `<p>A fair question to ask any pre-Series-A vendor, and one we'd rather you ask now than discover post-signing.</p>
        <p>Two safeguards. <strong>One,</strong> every Compass deployment ships with <strong>escrowed source access</strong> in the MSA — if Klaut becomes unable to deliver, you retain the right to access and operate the deployed system. <strong>Two,</strong> Compass runs on standard cloud infrastructure (your VPC, your keys, your foundation-model provider account) — the deployed system continues operating independently of Klaut's continued existence.</p>
        <p>We'd rather lose a deal to a bigger competitor than have you discover a dependency you didn't sign up for.</p>`
  },
];

const FAQ_ID = [
  // ---------------- fit (4) ----------------
  {
    cat: 'fit',
    q: "Apa itu Klaut, dan apa itu Compass — sama atau beda?",
    a: `<p>Beda. Dua lapisan dari satu sistem yang sama.</p>
        <p><strong>Compass adalah produknya</strong> — sistem workforce intelligence yang mengenali orang di balik setiap pekerjaan. Compass mengamati bagaimana tim Anda bekerja di sistem yang sudah dipakai sehari-hari, mengoreksi kesalahan saat itu juga, menghasilkan micro-lesson personal dari gap yang teramati, dan melaporkan perkembangan lewat tiga sudut pandang yang terpisah secara privasi: karyawan, manager, HR.</p>
        <p><strong>Klaut adalah perusahaan yang mengkustomisasi dan men-deploy Compass.</strong> Compass berjalan standalone; Klaut yang mengonfigurasinya untuk stack Anda, menulis integrasinya, membangun dashboard yang benar-benar dibaca eksekutif Anda, dan tetap standby selama deployment berjalan. Referensi strukturalnya adalah model deployed-engineer Palantir — diadaptasi untuk skala mid-market.</p>`
  },
  {
    cat: 'fit',
    q: "Compass cocok untuk siapa, dan siapa yang tidak boleh beli?",
    a: `<p>Compass dibangun untuk perusahaan yang butuh AI memberikan produktivitas <strong>tanpa harus melepaskan tenaga kerja</strong>. Itu makin sering berarti: perusahaan Indonesia yang menanggung beban sosial PHK massal, perusahaan EU di bawah kewajiban AI Act untuk worker-impact assessment, dan perusahaan US yang resistensi internalnya datang dari serikat atau budaya kerja — bukan dari teknologinya.</p>
        <p>Kalau strategi AI Anda adalah <em>"kurangi tim 30%"</em>, Klaut bukan firm yang tepat. Kami lebih baik bilang itu di telepon pertama daripada habis satu kuartal pura-pura. Produknya memang kami rancang supaya pendapatan kami tidak bergantung pada pengurangan headcount.</p>`
  },
  {
    cat: 'fit',
    q: "Kami cuma butuh chatbot AI, bukan urusan workforce. Pas?",
    a: `<p>Kemungkinan besar tidak — dan akan kami bilang di telepon pertama.</p>
        <p>Banyak vendor yang bisa jual chatbot. Compass dibuat untuk perusahaan yang <em>sudah</em> — atau akan segera — men-deploy AI di atas tenaga kerjanya, dan ingin <em>orangnya</em> tumbuh seiring AI-nya pintar. Kalau yang Anda butuhkan cuma chatbot menghadap pelanggan, partner implementasi generic akan lebih cepat dan lebih murah dari Klaut.</p>`
  },
  {
    cat: 'fit',
    q: "Kami sudah pakai Lattice / Culture Amp / Cresta / Observe.AI. Bedanya apa?",
    a: `<p>Masing-masing menguasai satu potongan dari loop. <strong>Lattice dan Culture Amp</strong> di performance management. <strong>Cresta dan Observe.AI</strong> di conversation intelligence. <strong>LMS</strong> di training formal.</p>
        <p>Tidak ada yang menutup loop dari <em>kesalahan teramati → koreksi personal → micro-lesson → re-assessment</em>. Tidak ada yang dirancang dengan <strong>privacy-bounded three-buyer alignment</strong> (karyawan memiliki kesalahannya sendiri; manager melihat agregat; HR melihat kapabilitas tingkat role). Mereka tidak bisa adopt posisi itu tanpa membongkar enterprise sales motion mereka — yang justru dibangun di atas visibilitas per-individu untuk manager.</p>
        <p>Gap-nya bersifat posisional, bukan tingkat fitur. Lebih sulit menyalin posisi daripada menyalin satu fitur.</p>`
  },

  // ---------------- tech (5) ----------------
  {
    cat: 'tech',
    q: "Bagaimana Compass sebenarnya bekerja dari awal sampai akhir?",
    a: `<p>Lima langkah, berjalan terus-menerus.</p>
        <p><strong>1. Observe</strong> — Compass terhubung ke sistem kerja yang sudah dipakai tim (helpdesk, CRM, antrian tiket) dan membaca <em>work product</em>-nya: tiketnya, jawabannya, jalur resolusinya. Bukan layar. Bukan keystroke.</p>
        <p><strong>2. Correct</strong> — saat kesalahan teridentifikasi, Compass mengintervensi saat itu juga, secara pribadi, dengan nada yang dirancang untuk pengembangan, bukan teguran.</p>
        <p><strong>3. Educate</strong> — dari data koreksi yang terakumulasi, Compass menghasilkan micro-lesson 5–10 menit yang menargetkan failure mode spesifik orang itu.</p>
        <p><strong>4. Assess</strong> — secara periodik, Compass menguji apakah pelajaran sudah terinternalisasi — bukan lewat kuis, melainkan dengan mengamati pekerjaan nyata sepanjang waktu.</p>
        <p><strong>5. Report</strong> — setiap bulan, tiga laporan terpisah: report card personal untuk karyawan, agregat untuk manager, role/function-level untuk HR.</p>
        <p>Makin lama loop berjalan, makin baik personalisasinya. Makin lama loop berjalan, makin kaya taksonomi kesalahan per-role yang dibangun Compass — dan taksonomi itu adalah aset proprietary yang tidak mudah ditiru kompetitor.</p>`
  },
  {
    cat: 'tech',
    q: "Apakah Compass merekam layar, menangkap keystroke, atau membaca pesan pribadi?",
    a: `<p><strong>Tidak, tidak, dan tidak.</strong></p>
        <p>Compass membaca <em>work product</em> melalui API sistem yang sudah Anda pakai — tiket di helpdesk, balasan di CRM, percakapan di platform layanan. Kami tidak menginstal screen recorder. Kami tidak menangkap keystroke. Kami tidak punya akses ke channel pribadi (DM, email pribadi, apa pun di luar sistem kerja yang Anda hubungkan secara eksplisit).</p>
        <p>Surveillance justru kebalikan dari tujuan Compass dibangun. Kalau kriteria evaluasi Anda memerlukan monitoring sedalam itu, kami bukan produk yang tepat.</p>`
  },
  {
    cat: 'tech',
    q: "Sistem kerja apa saja yang Compass dukung saat ini?",
    a: `<p>Rilis awal menargetkan stack customer service: <strong>Zendesk, Freshdesk, Intercom, Salesforce Service Cloud</strong>, ditambah platform CS Indonesia yang dipakai anchor partner kami. Integrasi CRM dan ticketing berkembang dari situ.</p>
        <p>Kalau stack Anda belum ada di daftar, engagement Foundation akan memetakan biaya integrasinya sebelum Anda komit apa pun — Anda tidak akan menemukan konektor yang hilang di minggu kelima.</p>`
  },
  {
    cat: 'tech',
    q: "Customer service jadi vertical pertama. Kapan sales, engineering, operasional?",
    a: `<p>Urutannya ditentukan oleh seberapa <em>terstruktur</em> work product di vertical itu agar bisa diamati Compass dengan andal — bukan oleh permintaan yang paling keras.</p>
        <p><strong>Customer Service</strong> didahulukan karena sinyal performanya jelas (handle time, resolusi, CSAT, escalation rate) dan friksi budaya untuk mengamati pekerjaan individu paling rendah. <strong>MVP target: Agustus 2026. Pilot pertama: Oktober 2026.</strong></p>
        <p><strong>Sales</strong> jadi vertical kedua natural (konversi pipeline, deal cycle, win rate — metrik sama-sama bersih). <strong>Support engineering</strong> dan <strong>operasional</strong> menyusul saat taksonomi kesalahan di domain itu sudah matang. Tanggal di luar CS akan kami publikasikan hanya setelah pilot pertama tutup — kami lebih baik under-promise daripada janji roadmap multi-vertical sebelum yang pertama jalan.</p>`
  },
  {
    cat: 'tech',
    q: "Model AI baru yang lebih bagus muncul di tengah deployment. Lalu bagaimana?",
    a: `<p>Kami ganti modelnya.</p>
        <p>Setiap deployment Compass berjalan melalui <strong>provider-abstraction layer</strong> — Anthropic hari ini, OpenAI besok, Gemini kuartal depan, atau open-weights model di VPC Anda kalau evaluasinya jatuh ke situ. Pergantian adalah perubahan konfigurasi, bukan rewrite.</p>
        <p>Taksonomi kesalahan yang Compass pelajari tentang <em>tim Anda</em> adalah aset proprietary-nya. Model dasarnya hanyalah infrastruktur yang bisa diganti.</p>`
  },

  // ---------------- security (3) — privacy & data ----------------
  {
    cat: 'security',
    q: "Apakah manager saya bisa melihat setiap kesalahan saya?",
    a: `<p><strong>Tidak. Arsitektur privasi adalah produknya, bukan fitur tambahan.</strong></p>
        <p>Kesalahan personal milik karyawan. Manager melihat agregat kapabilitas tim — kekuatan, gap umum, kecepatan pembelajaran — tanpa drill-down ke individu mana pun. Sudut pandang HR beroperasi di level role-and-function, bukan level orang. Tidak ada drill-down dari manager ke individu tanpa <strong>persetujuan eksplisit yang tercatat</strong> dari orang itu.</p>
        <p>Ini bukan setelan yang admin bisa matikan. Ini terjalin di model datanya. Justru karena itu, Compass bisa menyelaraskan tiga pembeli — CEO, HR, karyawan — yang biasanya saling tarik-menarik di produk kompetitor.</p>`
  },
  {
    cat: 'security',
    q: "Apakah data kami dipakai untuk melatih model — milik Klaut, atau milik vendor model dasar?",
    a: `<p>Tidak.</p>
        <p>Kami menandatangani <strong>zero-retention agreement</strong> dengan setiap penyedia foundation model sebelum data mengalir. Kalau ada provider yang tidak bisa menawarkan zero-retention untuk akun Anda, kami tidak akan memakainya untuk akun Anda — selalu ada alternatif.</p>
        <p>Klaut sebagai perusahaan tidak menjalankan model sendiri yang belajar dari data Anda. Taksonomi kesalahan per-role yang Compass bangun terkurung di tenant Anda — tidak digabung lintas klien, tidak dijual, tidak dipakai melatih model bersama.</p>`
  },
  {
    cat: 'security',
    q: "EU AI Act, UU PDP Indonesia, SOC 2 — bagaimana posisi kepatuhan Klaut?",
    a: `<p>Jujur saja: dua dari tiga itu sudah <em>compliance arsitektural</em>, satu masih operasional dan belum selesai.</p>
        <p><strong>EU AI Act:</strong> desain tiga-view yang privacy-bounded sudah langsung menjawab kewajiban worker-impact. Kami menyediakan artefak worker-impact assessment yang Act minta untuk sistem AI high-risk.</p>
        <p><strong>UU PDP Indonesia:</strong> residensi data, pembatasan tujuan, dan persetujuan sudah dirancang ke dalam model data — data Anda tetap di lingkungan Anda, terkurung pada tujuan yang dinyatakan.</p>
        <p><strong>SOC 2 Type II:</strong> ada di daftar moat operasional kami, <strong>target Q4 2027</strong> sebagai bagian dari kesiapan Series A. Kalau atestasi SOC 2 adalah syarat procurement keras Anda hari ini, kami belum cocok — dan itu akan kami bilang di telepon pertama.</p>`
  },

  // ---------------- pricing (3) ----------------
  {
    cat: 'pricing',
    q: "Berapa biaya engagement Klaut dari awal sampai berjalan?",
    a: `<p>Tiga lapisan, semua harga disepakati tertulis sebelum pekerjaan apa pun dimulai.</p>
        <p><strong>Foundation</strong> (paid discovery & assessment): <code>$8,000–$25,000</code> tergantung scope dan ukuran klien. Harga fixed.</p>
        <p><strong>Implementation</strong> (mengubah temuan Foundation menjadi sistem yang ter-deploy): <code>$25,000–$120,000</code> tergantung kompleksitas integrasi dan berapa fungsi yang akan dipasang Compass. Harga fixed.</p>
        <p><strong>Compass subscription</strong> (lapisan recurring): <code>$5,000–$18,000 per bulan</code> di skala mid-market, per-seat per-month, terikat pada jumlah karyawan yang diamati Compass.</p>
        <p>Tanpa retainer. Tanpa hourly billing. Tanpa line item kejutan di akhir. Kalau kami meleset dari metrik yang disepakati di Foundation, kami tetap kerja dengan biaya kami sendiri sampai tercapai — atau refund pembayaran terakhir lalu mundur.</p>`
  },
  {
    cat: 'pricing',
    q: "Kenapa Foundation discovery berbayar, bukan gratis?",
    a: `<p>Discovery gratis tidak berhasil untuk kedua pihak.</p>
        <p>Discovery gratis menarik klien yang belum memutuskan apakah AI penting untuk bisnisnya — kami berakhir mengerjakan pre-sales untuk perusahaan yang tidak pernah close. <strong>Membayar Foundation berfungsi sebagai pre-qualification</strong> untuk engagement berikutnya, dan kami pakai biayanya untuk melakukan pekerjaan diagnostik yang sungguh-sungguh, bukan menutup-nutupi jawaban sulit demi menyenangkan Anda.</p>
        <p>Sekitar 1 dari 5 klien Foundation memutuskan tidak melanjutkan ke implementation. Itu sehat — kedua pihak harus mundur kalau diagnostiknya tidak mendukung pengeluaran yang lebih besar.</p>`
  },
  {
    cat: 'pricing',
    q: "Compass subscription — per seat? Tahunan? Bisa dibatalkan?",
    a: `<p><strong>Per-seat per-month</strong>, ditagih bulanan, terikat pada jumlah karyawan yang Compass amati di fungsi yang ter-deploy.</p>
        <p>Term standar 12 bulan begitu implementation live. Syarat pembatalan ada di MSA — tidak ada jebakan auto-renew; Anda perpanjang atau tidak, terserah.</p>
        <p><strong>Lifetime value berlipat</strong> saat Anda memasang Compass ke fungsi tambahan di bawah MSA yang sama — mulai dari customer service, tahun depan tambah sales, lalu support engineering, lalu operasional. Overhead per-deployment teramortisasi, jadi biaya marjinal per fungsi tambahan menurun seiring waktu.</p>`
  },

  // ---------------- process (3) ----------------
  {
    cat: 'process',
    q: "Cara mulainya bagaimana — 90 hari pertama itu seperti apa?",
    a: `<p>Tiga fase.</p>
        <p><strong>Minggu 1–2 · Foundation kickoff.</strong> Kami memetakan eksposur AI Anda saat ini, mengidentifikasi peluang workforce intelligence dengan leverage paling tinggi, menyepakati metrik yang akan diukur, dan menscope implementation-nya. Deliverable: proposal satu halaman yang bisa Anda bawa ke vendor mana pun — milik Anda.</p>
        <p><strong>Minggu 3–8 · Implementation.</strong> Compass ter-deploy ke fungsi yang disepakati. Integrasi ke sistem Anda. Arsitektur privasi dikonfigurasi sesuai industri dan yurisdiksi Anda. Dashboard dibangun. Kami on-site di minggu pertama fase ini.</p>
        <p><strong>Minggu 9–12 · Pilot run.</strong> Compass mulai mengamati. Loop lima langkah berjalan. Laporan bulanan pertama keluar ke karyawan, manager, dan HR. Di hari ke-90 Anda sudah punya deployment hidup yang menghasilkan nilai majemuk — bukan pilot yang berakhir di deck.</p>`
  },
  {
    cat: 'process',
    q: "Siapa dari tim kami yang harus hadir?",
    a: `<p>Tiga orang, tidak bisa ditawar.</p>
        <p><strong>Satu eksekutif</strong> (CEO, COO, atau function head) yang bisa membuka procurement dan security dalam hitungan sore, bukan dua minggu.</p>
        <p><strong>Satu operational owner</strong> — kepala fungsi yang ke situ Compass akan ter-deploy. Head of Customer Service untuk vertical pertama. Mereka co-own metrik yang disepakati di Foundation.</p>
        <p><strong>Satu IT atau security lead</strong> untuk menangani integrasi ke sistem yang ada dan review privasi terhadap regime governance Anda.</p>
        <p>Tanpa ketiganya hadir dan bertanggung jawab, engagement tidak kami ambil. Kami sudah belajar ini dari pengalaman mahal.</p>`
  },
  {
    cat: 'process',
    q: "Remote atau on-site? Klaut bekerja dari mana?",
    a: `<p>Jakarta adalah base kami.</p>
        <p>Kami <strong>on-site di minggu pertama implementation dan saat cutover akhir</strong>, remote di tengah-tengahnya dengan overlap 4 jam pada jam kerja Anda. Klien Indonesia dan Asia Tenggara mendapat full on-site availability sepanjang engagement kalau diperlukan.</p>
        <p>Klien global (Eropa, US, Amerika Latin) mendapat kunjungan on-site bulanan, dengan biaya perjalanan sudah termasuk dalam harga engagement — tidak ada line item perjalanan terpisah, tidak ada expense report yang harus disetujui kemudian.</p>`
  },

  // ---------------- after (2) — honest state + long-term ----------------
  {
    cat: 'after',
    q: "Pertanyaan jujur — Klaut sudah punya klien berbayar?",
    a: `<p><strong>Belum.</strong> Pre-revenue, di tahap MVP. Tidak akan kami pura-pura sebaliknya.</p>
        <p>Per Mei 2026: 38 prospek teridentifikasi, 9 percakapan aktif, 4 peluang qualified, 1 proposal terkirim, 0 kontrak ditandatangani. <strong>Klien Foundation berbayar pertama target akhir Q2 2026.</strong> Compass MVP target Agustus 2026. Pilot pertama target Oktober 2026. Aplikasi YC Summer 2027 di Q1 2027 dengan data pilot itu di tangan.</p>
        <p>Kalau "sepuluh referensi klien di vertical kami" adalah batas minimal Anda, kami belum jadi firm yang tepat. Langkah benarnya: kembali di Q1 2027 saat case study pilot pertama sudah hidup, atau lanjutkan percakapan sekarang dan biarkan kami earn deployment-nya saat Compass sudah nyata.</p>`
  },
  {
    cat: 'after',
    q: "Klaut perusahaan kecil. Kalau Klaut tutup, deployment kami bagaimana?",
    a: `<p>Pertanyaan adil untuk vendor pre-Series-A mana pun, dan kami lebih suka Anda menanyakannya sekarang daripada menemukan jawabannya pasca-tandatangan.</p>
        <p>Dua pengaman. <strong>Pertama,</strong> setiap deployment Compass dilengkapi <strong>escrowed source access</strong> di MSA — kalau Klaut tidak bisa lagi mengirim, Anda tetap berhak mengakses dan mengoperasikan sistem yang sudah ter-deploy. <strong>Kedua,</strong> Compass berjalan di infrastruktur cloud standar (VPC Anda, kunci Anda, akun foundation-model provider Anda) — sistem yang ter-deploy terus berjalan secara independen dari keberlanjutan Klaut.</p>
        <p>Kami lebih baik kalah deal ke kompetitor besar daripada Anda kemudian menemukan ketergantungan yang tidak Anda tanda-tangani.</p>`
  },
];

// -------------------------------------------------------------------------
// Apply: replace the existing FAQ array literal in each file.
// -------------------------------------------------------------------------
function serializeFAQ(arr) {
  // We emit JS source with template-literal answers (matches the existing style)
  return (
    'const FAQ = [\n' +
    arr
      .map(
        (item) =>
          `  {\n` +
          `    cat: ${JSON.stringify(item.cat)},\n` +
          `    q: ${JSON.stringify(item.q)},\n` +
          `    a: \`${item.a.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`\n` +
          `  },`
      )
      .join('\n') +
    '\n];'
  );
}

function replaceFAQArray(path, arr) {
  let html = readFileSync(path, 'utf8');
  const re = /const FAQ\s*=\s*\[[\s\S]+?\n\];/;
  if (!re.test(html)) {
    console.error(`No FAQ array found in ${path}`);
    process.exit(1);
  }
  html = html.replace(re, serializeFAQ(arr));
  writeFileSync(path, html);
  console.log(`${path}: replaced FAQ array with ${arr.length} entries.`);
}

replaceFAQArray('faq.html', FAQ_EN);
replaceFAQArray('id/faq.html', FAQ_ID);
