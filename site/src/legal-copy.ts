import type { Lang } from "./copy"

// legal facts for the operator block and the notices; empty fields are not rendered
export const OPERATOR = {
  legalName: "",
  address: "",
  companyId: "",
  register: "",
  vatId: "",
  email: "",
  phone: "",
}

export const ISSUES = "https://github.com/uteg-labs/just-mate/issues"
export const REVIEWED = "2026-11-22"

export const PAGES = ["privacy", "terms", "accessibility", "faq"] as const
export type Page = (typeof PAGES)[number]

export type Section = { h: string; p?: string[]; ul?: string[] }
export type Doc = { title: string; intro: string; sections: Section[] }

export const UI = {
  en: {
    skip: "Skip to content",
    home: "Back to the home page",
    updated: "Last reviewed",
    operator: "Operator",
    team: "the JustMate team",
    contact: "Contact",
    contactVia: "by an issue on GitHub",
    legalName: "Company",
    address: "Address",
    companyId: "Company ID",
    register: "Register entry",
    vatId: "VAT ID",
    email: "E-mail",
    phone: "Phone",
    links: {
      faq: "FAQ",
      privacy: "Privacy policy",
      terms: "Terms and conditions",
      accessibility: "Accessibility statement",
    },
  },
  pl: {
    skip: "Przejdź do treści",
    home: "Wróć na stronę główną",
    updated: "Ostatni przegląd",
    operator: "Operator",
    team: "zespół JustMate",
    contact: "Kontakt",
    contactVia: "przez zgłoszenie na GitHubie",
    legalName: "Firma",
    address: "Adres",
    companyId: "Numer firmy",
    register: "Wpis do rejestru",
    vatId: "NIP / VAT",
    email: "E-mail",
    phone: "Telefon",
    links: {
      faq: "Najczęstsze pytania",
      privacy: "Polityka prywatności",
      terms: "Regulamin",
      accessibility: "Deklaracja dostępności",
    },
  },
} satisfies Record<Lang, unknown>

const en: Record<Page, Doc> = {
  privacy: {
    title: "Privacy policy",
    intro:
      "This notice covers this website and its waitlist. What the app handles is summarised under Security and privacy on the home page; the app gets its own notice before launch.",
    sections: [
      {
        h: "Who is responsible",
        p: [
          "The controller is the JustMate team, the people listed on the home page, as shown in the operator block of the footer. For privacy requests write through the contact given there.",
        ],
      },
      {
        h: "What we process and why",
        ul: [
          "Waitlist: the email address you enter, whether you join as a person or a venue, an optional city, the language of the page and the time you signed up. We use it to write to you once, when JustMate opens in your city. Basis: your consent (GDPR Art. 6(1)(a)), given by submitting the form. Kept until we have sent that message or you ask us to delete it.",
          "Server logs: the hosting provider processes your IP address and browser details when a page is served, to deliver the site and keep it secure. Basis: legitimate interest (Art. 6(1)(f)).",
          "Visit statistics: Vercel Web Analytics counts page views without cookies and without following you across sites or building a profile. Basis: legitimate interest (Art. 6(1)(f)).",
          "Poll: the optional /poll page counts anonymous answers and stores one flag in your browser's local storage so that it does not ask twice. No email or identifier is stored with the answers.",
        ],
      },
      {
        h: "Cookies",
        p: [
          "This site sets no cookies and loads no advertising or tracking tools, so there is no cookie banner. The films are served from this site; YouTube is only opened when you follow the link to our channel.",
        ],
      },
      {
        h: "Who receives the data",
        p: [
          "Vercel Inc. hosts the site and its waitlist function, and Upstash stores the waitlist in a database. Both act as our processors. We do not sell data and do not use it for advertising.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "You may ask for access to your data, correction, deletion, restriction, a copy in a portable format, and you may object to processing or withdraw your consent at any time; withdrawing does not affect what was done before. You may also complain to the data protection authority of your country.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms and conditions",
    intro:
      "These terms apply to this website. JustMate is not on sale yet: the site sells nothing and no purchase contract is made through it.",
    sections: [
      {
        h: "The site and the waitlist",
        p: [
          "The site presents JustMate and takes waitlist sign-ups. Joining is free and binds neither side: we write to you when JustMate opens near you, and you may ask us to remove your email at any time.",
        ],
      },
      {
        h: "Content",
        p: [
          "Text, films, images and the brand belong to the JustMate team. You may share links to the site and quote it with credit. The source code is published at github.com/uteg-labs/just-mate under the licence in the repository.",
        ],
      },
      {
        h: "Accuracy and your rights",
        p: [
          "The site describes a product under development; features, prices and dates may change before launch. Nothing here limits the rights you have as a consumer under the law of your country.",
        ],
      },
      {
        h: "Complaints",
        p: [
          "If something on the site or about your waitlist entry is wrong, tell us through the contact in the footer and we will answer and put it right.",
        ],
      },
      {
        h: "Out-of-court dispute resolution",
        p: [
          "If we cannot settle a complaint, you may turn to an alternative dispute resolution (ADR) body in your country of residence; the EU online dispute platform closed on 20 July 2025. This site sells no goods or services, so there is currently no contract to dispute. The ADR body named for the contracts of the app will be given here before it opens.",
        ],
      },
    ],
  },
  accessibility: {
    title: "Accessibility statement",
    intro:
      "This statement covers the website just-mate-site.vercel.app, operated by the JustMate team. It aims to conform to WCAG 2.1 level AA (EN 301 549 v3.2.1), as the European Accessibility Act (Directive (EU) 2019/882) and the national laws implementing it, in Slovakia Act No. 351/2022 Coll., require.",
    sections: [
      {
        h: "Status",
        p: [
          "The site is partly conformant with WCAG 2.1 AA. Text meets the contrast ratios, controls have names and can be reached with the keyboard with a visible focus, a skip link leads to the content, and the page has language and heading structure.",
        ],
      },
      {
        h: "Known gaps",
        ul: [
          "The films have on-screen captions but no audio description and no separate text transcript. The text of each story is on the page; we are preparing transcripts.",
          "The films are rendered by a video player that may not announce every state to a screen reader.",
        ],
      },
      {
        h: "Report a barrier",
        p: [
          "If you cannot use something, tell us through the contact in the footer and say which page and what you use. We answer and try to fix it or offer the same content another way.",
        ],
      },
      {
        h: "Enforcement",
        p: [
          "If our answer does not help, you may turn to the market-surveillance authority for accessibility of services in your country.",
        ],
      },
      {
        h: "Review",
        p: ["This statement was last reviewed on 22 November 2026."],
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    intro:
      "Short answers about JustMate. The product is not open yet; join the waitlist on the home page.",
    sections: [
      {
        h: "How much does JustMate cost?",
        p: [
          "Meeting people is free: matching, the plans the app makes for you and every safety feature stay free. Paid parts, planned, are for venues that list tables, and an optional JustMate+ at €4.99 a month for convenience such as several open invitations at once. Connections are never paywalled.",
        ],
      },
      {
        h: "Is there a free plan or a trial?",
        p: [
          "The core app is free, so there is no trial to start or end. JustMate has not opened yet: leave your email on the waitlist and we write once, when it is your turn in your city.",
        ],
      },
      {
        h: "What is the minimum age?",
        p: [
          "You must be 16. Date mode is for adults only (18+) and is checked on the server. People under 18 only ever meet other people under 18, in Mate mode, and an adult is never matched with a minor.",
        ],
      },
      {
        h: "How do you keep me safe and verify people?",
        p: [
          "A plan is on only when you both say yes, and a vanish tap ends everything for both of you at once. There is no chat, so nobody can message you, and people meet at public places. A one-selfie check, deleted after the check, backs the verified tag (simulated in the current build; phone and ID checks come with launch). Report someone and they are blocked for you; two independent reports pause them.",
        ],
      },
      {
        h: "Where is my data stored, and what about my location?",
        p: [
          "Your exact position is held in server memory only while you search or walk to someone and is dropped when the session ends. There is no location history, and nobody's coordinates ever reach your phone, only a direction and a distance range. We keep your account, profile and plans (with a rough area of about 1 km). We never keep photos of you, messages, or mood or health data.",
        ],
      },
      {
        h: "How do I cancel or delete my account?",
        p: [
          "In the app, open Settings to download everything we hold about you or to delete your account. For the website waitlist, ask through the contact in the footer and we delete your email.",
        ],
      },
      {
        h: "How do I get support?",
        p: [
          "Write through the contact in the footer, by an issue on GitHub. The app has a help entry with local support lines; in Poland, call 116 123 if you need to talk to someone. JustMate is not therapy.",
        ],
      },
      {
        h: "How does onboarding work?",
        p: [
          "It takes a few minutes: choose what you are up for, your interests, a few short questions and which sample faces you like, then a one-selfie check. After that the app proposes a small plan with one compatible person, or, when you are already out, walks you to someone nearby right now. You only say yes.",
        ],
      },
    ],
  },
}

const pl: Record<Page, Doc> = {
  privacy: {
    title: "Polityka prywatności",
    intro:
      "Ta informacja dotyczy tej strony i listy oczekujących. Co robi aplikacja, streszcza sekcja „Bezpieczeństwo i prywatność” na stronie głównej; aplikacja dostanie własną informację przed startem.",
    sections: [
      {
        h: "Kto odpowiada za dane",
        p: [
          "Administratorem jest zespół JustMate, czyli osoby wymienione na stronie głównej, jak w bloku operatora w stopce. W sprawach prywatności napisz przez kontakt podany w stopce.",
        ],
      },
      {
        h: "Co przetwarzamy i po co",
        ul: [
          "Lista oczekujących: adres e-mail, który wpisujesz, informacja, czy dołączasz jako osoba czy lokal, opcjonalne miasto, język strony i czas zapisu. Używamy ich, żeby napisać do ciebie raz, gdy JustMate ruszy w twoim mieście. Podstawa: twoja zgoda (RODO art. 6 ust. 1 lit. a), wyrażona przez wysłanie formularza. Przechowujemy do wysłania tej wiadomości albo do twojej prośby o usunięcie.",
          "Logi serwera: dostawca hostingu przetwarza twój adres IP i dane przeglądarki przy wyświetlaniu strony, żeby ją dostarczyć i chronić. Podstawa: prawnie uzasadniony interes (art. 6 ust. 1 lit. f).",
          "Statystyki odwiedzin: Vercel Web Analytics liczy wyświetlenia stron bez plików cookie, bez śledzenia cię między witrynami i bez budowania profilu. Podstawa: prawnie uzasadniony interes (art. 6 ust. 1 lit. f).",
          "Ankieta: opcjonalna strona /poll zlicza anonimowe odpowiedzi i zapisuje jedną flagę w pamięci lokalnej przeglądarki, żeby nie pytać dwa razy. Z odpowiedziami nie zapisujemy e-maila ani identyfikatora.",
        ],
      },
      {
        h: "Pliki cookie",
        p: [
          "Ta strona nie ustawia plików cookie i nie ładuje narzędzi reklamowych ani śledzących, więc nie ma banera cookie. Filmy są serwowane z tej strony; YouTube otwiera się dopiero po kliknięciu linku do naszego kanału.",
        ],
      },
      {
        h: "Kto otrzymuje dane",
        p: [
          "Vercel Inc. hostuje stronę i funkcję listy oczekujących, a Upstash przechowuje listę w bazie danych. Obie firmy działają jako nasi podmioty przetwarzające. Nie sprzedajemy danych i nie używamy ich do reklam.",
        ],
      },
      {
        h: "Twoje prawa",
        p: [
          "Możesz żądać dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania i kopii w przenośnym formacie, a także sprzeciwić się przetwarzaniu lub w każdej chwili wycofać zgodę; wycofanie nie wpływa na to, co zrobiono wcześniej. Możesz też złożyć skargę do organu ochrony danych w swoim kraju.",
        ],
      },
    ],
  },
  terms: {
    title: "Regulamin",
    intro:
      "Regulamin dotyczy tej strony. JustMate nie jest jeszcze w sprzedaży: strona niczego nie sprzedaje i nie zawiera się przez nią umowy kupna.",
    sections: [
      {
        h: "Strona i lista oczekujących",
        p: [
          "Strona przedstawia JustMate i przyjmuje zapisy na listę oczekujących. Zapis jest bezpłatny i do niczego nie zobowiązuje: napiszemy, gdy JustMate ruszy blisko ciebie, a swój e-mail możesz w każdej chwili poprosić o usunięcie.",
        ],
      },
      {
        h: "Treści",
        p: [
          "Teksty, filmy, obrazy i marka należą do zespołu JustMate. Możesz udostępniać linki do strony i cytować ją z podaniem źródła. Kod źródłowy jest opublikowany na github.com/uteg-labs/just-mate na licencji z repozytorium.",
        ],
      },
      {
        h: "Dokładność i twoje prawa",
        p: [
          "Strona opisuje produkt w budowie; funkcje, ceny i terminy mogą się zmienić przed startem. Nic tu nie ogranicza praw przysługujących ci jako konsumentowi według prawa twojego kraju.",
        ],
      },
      {
        h: "Reklamacje",
        p: [
          "Jeśli coś na stronie albo w twoim zapisie na listę jest nie tak, napisz przez kontakt w stopce, a odpowiemy i to poprawimy.",
        ],
      },
      {
        h: "Pozasądowe rozwiązywanie sporów",
        p: [
          "Jeśli nie uda się nam załatwić reklamacji, możesz zwrócić się do podmiotu alternatywnego rozwiązywania sporów (ADR) w kraju zamieszkania; unijna platforma ODR zakończyła działanie 20 lipca 2025 r. Ta strona nie sprzedaje towarów ani usług, więc nie ma obecnie umowy, której mógłby dotyczyć spór. Podmiot ADR dla umów aplikacji zostanie podany tutaj przed jej startem.",
        ],
      },
    ],
  },
  accessibility: {
    title: "Deklaracja dostępności",
    intro:
      "Deklaracja dotyczy strony just-mate-site.vercel.app, prowadzonej przez zespół JustMate. Strona dąży do zgodności z WCAG 2.1 na poziomie AA (EN 301 549 v3.2.1), jak wymagają tego europejski akt w sprawie dostępności (dyrektywa (UE) 2019/882) i wdrażające go przepisy krajowe, na Słowacji ustawa nr 351/2022.",
    sections: [
      {
        h: "Stan",
        p: [
          "Strona jest częściowo zgodna z WCAG 2.1 AA. Tekst spełnia wymagany kontrast, elementy mają nazwy i są dostępne z klawiatury z widocznym fokusem, link „Przejdź do treści” prowadzi do zawartości, a strona ma język i strukturę nagłówków.",
        ],
      },
      {
        h: "Znane braki",
        ul: [
          "Filmy mają napisy na ekranie, ale nie mają audiodeskrypcji ani osobnej transkrypcji. Tekst każdej historii jest na stronie; przygotowujemy transkrypcje.",
          "Filmy odtwarza odtwarzacz, który może nie zapowiadać czytnikowi ekranu każdego stanu.",
        ],
      },
      {
        h: "Zgłoś barierę",
        p: [
          "Jeśli czegoś nie możesz użyć, napisz przez kontakt w stopce i podaj stronę oraz z czego korzystasz. Odpowiemy i spróbujemy to naprawić albo udostępnić tę samą treść inaczej.",
        ],
      },
      {
        h: "Egzekwowanie",
        p: [
          "Jeśli nasza odpowiedź nie pomoże, możesz zwrócić się do organu nadzoru rynku w sprawie dostępności usług w swoim kraju.",
        ],
      },
      {
        h: "Przegląd",
        p: ["Deklarację ostatnio przejrzano 22 listopada 2026 r."],
      },
    ],
  },
  faq: {
    title: "Najczęstsze pytania",
    intro:
      "Krótkie odpowiedzi o JustMate. Produkt jeszcze nie ruszył; zapisz się na listę na stronie głównej.",
    sections: [
      {
        h: "Ile kosztuje JustMate?",
        p: [
          "Poznawanie ludzi jest darmowe: dopasowanie, plany, które robi dla ciebie aplikacja, i każda funkcja bezpieczeństwa pozostają bezpłatne. Płatne części, planowane, to lokale wystawiające stoliki oraz opcjonalny JustMate+ za 4,99 € miesięcznie za wygodę, np. kilka otwartych zaproszeń naraz. Połączeń nigdy nie zamykamy za paywallem.",
        ],
      },
      {
        h: "Czy jest darmowy plan albo okres próbny?",
        p: [
          "Podstawowa aplikacja jest darmowa, więc nie ma okresu próbnego do zaczynania ani kończenia. JustMate jeszcze nie ruszył: zostaw e-mail na liście, a napiszemy raz, gdy przyjdzie twoja kolej w twoim mieście.",
        ],
      },
      {
        h: "Jaki jest minimalny wiek?",
        p: [
          "Musisz mieć 16 lat. Tryb Date jest tylko dla dorosłych (18+) i sprawdza go serwer. Osoby poniżej 18 lat spotykają tylko inne osoby poniżej 18 lat, w trybie Mate, a dorosły nigdy nie jest dopasowany do niepełnoletniego.",
        ],
      },
      {
        h: "Jak dbacie o bezpieczeństwo i weryfikujecie ludzi?",
        p: [
          "Plan jest aktywny tylko wtedy, gdy oboje powiecie „tak”, a stuknięcie „zniknij” kończy wszystko dla was obojga naraz. Nie ma czatu, więc nikt nie może do ciebie pisać, a ludzie spotykają się w miejscach publicznych. Odznakę zweryfikowanego wspiera jedno selfie, usuwane po sprawdzeniu (w obecnej wersji symulowane; weryfikacja telefonu i dokumentu przyjdzie ze startem). Zgłoszona osoba jest dla ciebie zablokowana; dwa niezależne zgłoszenia ją wstrzymują.",
        ],
      },
      {
        h: "Gdzie są moje dane i co z lokalizacją?",
        p: [
          "Twoja dokładna pozycja jest w pamięci serwera tylko wtedy, gdy szukasz albo idziesz do kogoś, i znika po zakończeniu sesji. Nie ma historii lokalizacji, a na twój telefon nigdy nie trafiają niczyje współrzędne, tylko kierunek i przedział odległości. Przechowujemy konto, profil i plany (z przybliżonym obszarem około 1 km). Nigdy nie trzymamy twoich zdjęć, wiadomości ani danych o nastroju czy zdrowiu.",
        ],
      },
      {
        h: "Jak zrezygnować albo usunąć konto?",
        p: [
          "W aplikacji otwórz Ustawienia, żeby pobrać wszystko, co o tobie przechowujemy, albo usunąć konto. W sprawie listy oczekujących na stronie napisz przez kontakt w stopce, a usuniemy twój e-mail.",
        ],
      },
      {
        h: "Jak uzyskać pomoc?",
        p: [
          "Napisz przez kontakt w stopce, przez zgłoszenie na GitHubie. W aplikacji jest pomoc z lokalnymi telefonami wsparcia; w Polsce zadzwoń pod 116 123, jeśli potrzebujesz z kimś porozmawiać. JustMate nie jest terapią.",
        ],
      },
      {
        h: "Jak wygląda start w aplikacji?",
        p: [
          "Trwa kilka minut: wybierasz, na co masz ochotę, swoje zainteresowania, kilka krótkich pytań i które przykładowe twarze ci się podobają, potem jedno selfie do sprawdzenia. Następnie aplikacja proponuje mały plan z jedną zgodną osobą albo, gdy jesteś już na mieście, prowadzi cię do kogoś w pobliżu od razu. Ty mówisz tylko „tak”.",
        ],
      },
    ],
  },
}

export const DOCS: Record<Lang, Record<Page, Doc>> = { en, pl }

export function pagePath(lang: Lang, page: Page) {
  return lang === "pl" ? `/pl/${page}` : `/${page}`
}
