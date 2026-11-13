# Тест-дизайн: Request Lifecycle (State Machine)

- **Джерело:** `specs/02-request-lifecycle.md` (77 рядків; посилання `L<n>` нижче — номери рядків у цьому файлі)
- **Техніки:** ST (state transition), EP (equivalence partitioning), BV (boundary values)
- **Межі:** тільки те, що сказано в специфікації. Що текст не визначає, винесено в розділ «Невідомі» (U-xx), а не вгадано. Де очікування *виведене* з тексту, а не сказане прямо, воно позначене **[виведено]**.
- **Позначення результату:** `→ STATE` = 2xx і новий стан; `409` = відмова, стан не змінюється.

---

## 1. Модель

### 1.1 Стани (L46–L54)

| Стан | Термінальний | Чи можна спостерігати «в спокої» | Цитата |
| --- | --- | --- | --- |
| `DRAFT` | ні | так | "Created, never submitted. No gates have run." |
| `SUBMITTED` | ні | **ні** | "a request should never be observed sitting in `SUBMITTED`" |
| `UNDER_REVIEW` | ні | так | "All gates passed. Awaiting a reviewer decision." |
| `APPROVED` | ні | так | "Still cancellable until the deadline" |
| `REJECTED` | **так** | так | "Failed a gate, or refused by a reviewer." |
| `CANCELLED` | **так** | так | "Withdrawn by the operator." |
| `COMPLETED` | **так** | так | "Set **only** by the maintenance completion endpoint" |

### 1.2 Дії

| Дія | Хто викликає | Цитата |
| --- | --- | --- |
| `submit` | оператор [виведено: таблиця не називає актора] | L29 |
| `approve` | рецензент (`X-Reviewer-Id`) | "Reviewer-only (`X-Reviewer-Id`); writes a `ReviewAction` row" (L32) |
| `reject` | рецензент, `note` обовʼязковий | "Reviewer-only; `note` required" (L33) |
| `complete` | лише maintenance endpoint | "Maintenance endpoint only — never inferred from elapsed time" (L34) |
| `cancel` | оператор | "Operator-initiated" (L35–L38) |
| *gates pass* / *gates fail* | автоматично, всередині `submit` | "Not a caller-invoked action — part of the submit call's own outcome" (L30) |

### 1.3 Правило за замовчуванням

> "**Any `(from, action)` pair not listed here is illegal and must return `409`**" (L22–L23)

> "Every other pair — e.g. `REJECTED`→anything, `CANCELLED`→anything, `COMPLETED`→anything, or re-submitting something already `UNDER_REVIEW` — is illegal and returns `409`." (L40–L42)

---

## 2. ST — повна матриця стан × дія

7 станів × 5 дій, викликаних клієнтом = **35 клітинок**: 8 легальних, 27 нелегальних (`409`). Плюс 2 автоматичні переходи з `SUBMITTED`.

| From \ Action | submit | approve | reject | complete | cancel |
| --- | --- | --- | --- | --- | --- |
| **DRAFT** | ✅ → `UNDER_REVIEW` / `REJECTED` (ST-01, ST-02) | ❌ 409 (ST-10) | ❌ 409 (ST-11) | ❌ 409 (ST-12) | ✅ → `CANCELLED` (ST-03) |
| **SUBMITTED** | ❌ 409 ⚠ (ST-13) | ❌ 409 ⚠ (ST-14) | ❌ 409 ⚠ (ST-15) | ❌ 409 ⚠ (ST-16) | ✅ → `CANCELLED` ⚠ (ST-04) |
| **UNDER_REVIEW** | ❌ 409 (ST-17) | ✅ → `APPROVED` (ST-05) | ✅ → `REJECTED` (ST-06) | ❌ 409 (ST-18) | ✅ → `CANCELLED` (ST-07) |
| **APPROVED** | ❌ 409 (ST-19) | ❌ 409 (ST-20) | ❌ 409 (ST-21) | ✅ → `COMPLETED` (ST-08) | ✅ → `CANCELLED` *якщо ≥ 2 год до `window_start`*, інакше 409 (ST-09, див. BV-01) |
| **REJECTED** | ❌ 409 (ST-22) | ❌ 409 (ST-23) | ❌ 409 (ST-24) | ❌ 409 (ST-25) | ❌ 409 (ST-26) |
| **CANCELLED** | ❌ 409 (ST-27) | ❌ 409 (ST-28) | ❌ 409 (ST-29) | ❌ 409 (ST-30) | ❌ 409 (ST-31) |
| **COMPLETED** | ❌ 409 (ST-32) | ❌ 409 (ST-33) | ❌ 409 (ST-34) | ❌ 409 (ST-35) | ❌ 409 (ST-36) |

⚠ — рядок `SUBMITTED` не відтворюється black-box тестом: стан транзитний і "caller never observes `SUBMITTED` at rest" (L29). Див. U-01.

### 2.1 Легальні переходи (0-switch coverage)

| ID | From | Дія / подія | Очікування | Пре-умова | Цитата |
| --- | --- | --- | --- | --- | --- |
| ST-01 | `DRAFT` | submit, усі гейти проходять | → `UNDER_REVIEW`; у відповіді не видно `SUBMITTED` | валідний DRAFT | L29, L30 |
| ST-02 | `DRAFT` | submit, гейт падає | → `REJECTED`; `failing_gate` і `rejection_reason` заповнені | DRAFT з навмисно невалідними даними | L29, L31 |
| ST-03 | `DRAFT` | cancel (оператор) | → `CANCELLED` | DRAFT | L35 |
| ST-04 | `SUBMITTED` | cancel (оператор) | → `CANCELLED` | ⚠ неможливо зафіксувати SUBMITTED; "only reachable in the narrow window before gates resolve it automatically" (L36) | L36 |
| ST-05 | `UNDER_REVIEW` | approve (`X-Reviewer-Id`) | → `APPROVED`; створено рядок `ReviewAction` | UNDER_REVIEW | L32 |
| ST-06 | `UNDER_REVIEW` | reject (`X-Reviewer-Id`, `note`) | → `REJECTED`; `rejection_reason` заповнений | UNDER_REVIEW | L33, L52 |
| ST-07 | `UNDER_REVIEW` | cancel (оператор) | → `CANCELLED` | UNDER_REVIEW | L37 |
| ST-08 | `APPROVED` | complete (maintenance endpoint) | → `COMPLETED` | APPROVED | L34 |
| ST-09 | `APPROVED` | cancel (оператор), > 2 год до `window_start` | → `CANCELLED` | APPROVED, `window_start` далеко в майбутньому | L38, L58–L60 |

### 2.2 Нелегальні переходи (усі очікують `409`, стан не змінюється)

Загальне очікування для кожного: статус `409`; повторний `GET` показує той самий стан **[виведено]**: нелегальний перехід не повинен змінювати стан і не повинен писати рядок аудиту — "Every write to `FlightRequest.state` should go through one place … so the legal-transition check and the audit log write can't be forgotten" (L72–L74).

| ID | From | Дія | Окрема цитата / нотатка |
| --- | --- | --- | --- |
| ST-10 | `DRAFT` | approve | approve до будь-якої перевірки гейтів |
| ST-11 | `DRAFT` | reject | — |
| ST-12 | `DRAFT` | complete | — |
| ST-13…16 | `SUBMITTED` | submit / approve / reject / complete | ⚠ невідтворювано, U-01 |
| ST-17 | `UNDER_REVIEW` | submit | прямо названо: "re-submitting something already `UNDER_REVIEW`" (L3–L4, L25, L41) — **пріоритетний кейс** |
| ST-18 | `UNDER_REVIEW` | complete | обхід approve |
| ST-19 | `APPROVED` | submit | — |
| ST-20 | `APPROVED` | approve | повторний approve (ідемпотентність не дозволена — 409) |
| ST-21 | `APPROVED` | reject | рецензент не може передумати після approve |
| ST-22…26 | `REJECTED` | submit / approve / reject / complete / cancel | "`REJECTED`→anything" (L40); перевірити для обох шляхів у REJECTED: через гейт (ST-02) і через рецензента (ST-06) |
| ST-27…31 | `CANCELLED` | submit / approve / reject / complete / cancel | "`CANCELLED`→anything" (L40) |
| ST-32…36 | `COMPLETED` | submit / approve / reject / complete / cancel | "`COMPLETED`→anything" (L41) |

### 2.3 Наскрізні шляхи (1-switch / path coverage)

Кожен шлях покриває всі достяжні термінальні стани і всі легальні переходи хоча б раз.

| ID | Шлях | Покриває |
| --- | --- | --- |
| P-01 | `DRAFT` —submit(pass)→ `UNDER_REVIEW` —approve→ `APPROVED` —complete→ `COMPLETED` | щасливий шлях; ST-01, ST-05, ST-08 |
| P-02 | `DRAFT` —submit(fail)→ `REJECTED` | ST-02 |
| P-03 | `DRAFT` —submit(pass)→ `UNDER_REVIEW` —reject→ `REJECTED` | ST-06 |
| P-04 | `DRAFT` —cancel→ `CANCELLED` | ST-03 |
| P-05 | `DRAFT` —submit(pass)→ `UNDER_REVIEW` —cancel→ `CANCELLED` | ST-07 |
| P-06 | `DRAFT` —submit(pass)→ `UNDER_REVIEW` —approve→ `APPROVED` —cancel(>2h)→ `CANCELLED` | ST-09 |
| P-07 | P-01…P-06 + у кінці кожного шляху всі 5 дій над термінальним станом | ST-22…36 |

---

## 3. EP — класи еквівалентності

### EP-A. Стан × дія (зведення матриці)

| ID | Клас | Представник | Очікування |
| --- | --- | --- | --- |
| EP-A1 | легальна пара `(from, action)` з таблиці L27–L38 | `UNDER_REVIEW` + approve | 2xx, новий стан |
| EP-A2 | нелегальна пара з нетермінального стану | `UNDER_REVIEW` + submit | 409 |
| EP-A3 | будь-яка дія з термінального стану | `COMPLETED` + cancel | 409 |

### EP-B. Результат submit

| ID | Клас | Очікування | Цитата |
| --- | --- | --- | --- |
| EP-B1 | усі чотири гейти проходять | `UNDER_REVIEW` | L18, L50 |
| EP-B2 | хоча б один гейт падає | `REJECTED`, `failing_gate` + `rejection_reason` заповнені | L31, L52 |

Розбиття EP-B2 по окремих гейтах (`PILOT`/`AIRCRAFT`/`ZONE`/`TIME_WINDOW`) — поза цією специфікацією (06 — Business Rules).

### EP-C. Актор для approve / reject

| ID | Клас | Очікування |
| --- | --- | --- |
| EP-C1 | запит з `X-Reviewer-Id` | дозволено (ST-05/06) |
| EP-C2 | запит без `X-Reviewer-Id` (лише сесія оператора) | відмова — **код не визначено**, U-03 |
| EP-C3 | запит без будь-якої автентифікації | відмова — код не визначено, U-03 |

### EP-D. `note` для reject

| ID | Клас | Очікування |
| --- | --- | --- |
| EP-D1 | `note` присутній, непорожній | → `REJECTED` |
| EP-D2 | `note` відсутній у тілі | відмова — код не визначено, U-04 |
| EP-D3 | `note` = `""` або лише пробіли | чи вважається «наданим» — не визначено, U-04 |

### EP-E. Актор для cancel

| ID | Клас | Очікування |
| --- | --- | --- |
| EP-E1 | оператор (сесія) | дозволено |
| EP-E2 | рецензент (`X-Reviewer-Id`, без сесії) | "Operator-initiated" → відмова **[виведено]**; код не визначено, U-03 |

### EP-F. Шлях до `COMPLETED`

| ID | Клас | Очікування | Цитата |
| --- | --- | --- | --- |
| EP-F1 | виклик maintenance completion endpoint на `APPROVED` | → `COMPLETED` | L34, L54 |
| EP-F2 | `APPROVED`, `window_end` уже минув, ніхто не викликав complete | стан лишається `APPROVED` | "never inferred from elapsed time" (L34, L54) |

### EP-G. Дедлайн скасування — до яких станів застосовується

| ID | Клас | Очікування | Цитата |
| --- | --- | --- | --- |
| EP-G1 | `APPROVED`, ≥ 2 год до `window_start` | → `CANCELLED` | L38, L58 |
| EP-G2 | `APPROVED`, < 2 год до `window_start` | 409 | "Closer than that, the cancel endpoint should reject it (`409` …)" (L59–L61) |
| EP-G3 | `APPROVED`, `window_start` уже минув | 409 **[виведено]**: це теж "closer than" 2 год | L59 |
| EP-G4 | `UNDER_REVIEW`, < 2 год до `window_start` | → `CANCELLED` **[виведено]**: дедлайн сформульовано лише для `APPROVED`, рядок L37 умов не має. Див. U-06 | L37, L58 |
| EP-G5 | `DRAFT`, < 2 год до `window_start` | → `CANCELLED` **[виведено]**, як EP-G4 | L35 |

### EP-H. Стан іншої заявки на той самий aircraft (overlap)

> "Only `APPROVED` and `UNDER_REVIEW` requests are counted by the overlap check … `DRAFT`, `REJECTED`, `CANCELLED` and `COMPLETED` are invisible to it" (L63–L66)

Пре-умова: заявка X (aircraft A, вікно W) у стані S; нова заявка Y (aircraft A, вікно, що перетинається з W) подається через submit.

| ID | Стан X | Очікування для Y |
| --- | --- | --- |
| EP-H1 | `APPROVED` | Y → `REJECTED` (overlap, гейт — U-07) |
| EP-H2 | `UNDER_REVIEW` | Y → `REJECTED` |
| EP-H3 | `DRAFT` | Y → `UNDER_REVIEW` (X невидима) |
| EP-H4 | `REJECTED` | Y → `UNDER_REVIEW` |
| EP-H5 | `CANCELLED` | Y → `UNDER_REVIEW` |
| EP-H6 | `COMPLETED` | Y → `UNDER_REVIEW` |
| EP-H7 | X спершу `UNDER_REVIEW`, потім скасована | Y → `UNDER_REVIEW` (перехід X у `CANCELLED` звільняє вікно) **[виведено]** |

Окремий сценарій **EP-H8 (validate → submit race):** Y проходить `validate`; між validate і submit заявку X на той самий aircraft/вікно схвалюють; submit Y → `REJECTED`. Це "expected behavior, not a bug to work around" (L66–L68). Сам `validate` у цій специфікації не описаний — див. U-08.

---

## 4. BV — граничні значення

### BV-01. Дедлайн скасування `APPROVED` (L38, L58–L61)

Змінна: `Δ = window_start − момент виклику cancel`. Межа: **2 год = 120 хв**. Трійка (межа−1, межа, межа+1) у хвилинах:

| ID | Δ | Очікування | Впевненість |
| --- | --- | --- | --- |
| BV-01a | 121 хв | → `CANCELLED` | сказано: "up to 2 hours before" |
| BV-01b | **120 хв рівно** | → `CANCELLED`?  | **не визначено** — "up to" читається як включно, але "closer than that" не закриває питання однозначно; U-05 |
| BV-01c | 119 хв | 409, стан лишається `APPROVED` | сказано: "Closer than that … `409`" |

Друга (природна) межа того самого класу — момент початку вікна, `Δ = 0`:

| ID | Δ | Очікування |
| --- | --- | --- |
| BV-01d | +1 хв | 409 |
| BV-01e | 0 | 409 **[виведено]** |
| BV-01f | −1 хв (вікно вже почалось) | 409 **[виведено]** |

Якщо реалізація рахує в секундах — ті самі трійки з кроком 1 с (7201 / 7200 / 7199 с). Крок не визначено — U-05.

Практична нотатка: Δ залежить від реального годинника сервера; заявку треба створювати з `window_start = now + Δ` і враховувати час між створенням/схваленням і викликом cancel (запас у межах кроку трійки зʼїсть зсув). Для BV-01b точний тест потребує контролю часу на сервері.

### BV-02. Кількість дій над термінальним станом

Не числова межа, але гранична послідовність: перша спроба перейти з термінального стану (ST-22…36) і **повторна** спроба тієї самої дії, що щойно вдалася (ST-20 approve×2, ST-31 cancel×2, ST-35 complete×2, ST-17 submit×2). Обидві → 409; друга не створює дубль `ReviewAction` / рядка аудиту **[виведено]**.

### BV-03. Overlap «торкання» вікон

Межа «вікна лише торкаються — не перетинаються» описана в 06 (`TSD-4` §5), не в цій специфікації. Тут лише зазначено, що overlap рахує тільки `APPROVED`/`UNDER_REVIEW` (EP-H). BV для overlap — у тест-дизайні 06.

---

## 5. Пост-умови, які перевіряти разом із переходами

| ID | Коли | Що перевірити | Цитата |
| --- | --- | --- | --- |
| PC-01 | ST-05 approve | створено рядок `ReviewAction` | L32 |
| PC-02 | ST-02 / ST-06 → `REJECTED` | `failing_gate` і `rejection_reason` заповнені | L31, L52 (див. U-02 для reviewer-reject) |
| PC-03 | будь-який легальний перехід | зміна стану залогована (аудит, тригер БД) | L72–L76 |
| PC-04 | будь-який 409 | стан не змінився, нового рядка аудиту немає | **[виведено]** з L72–L74 |
| PC-05 | ST-01 | відповідь submit не повертає `SUBMITTED` як кінцевий стан | L29, L49 |

---

## 6. Невідомі (специфікація мовчить або суперечлива)

| ID | Питання | Звідки | Вплив на тести |
| --- | --- | --- | --- |
| U-01 | `SUBMITTED` — легальний перехід `cancel` (L36) і 4 нелегальні дії, але стан "should never be observed sitting in `SUBMITTED`" (L49). Як потрапити в це вікно в тесті? Чи існує воно взагалі, якщо гейти "run synchronously" (L29)? | L29, L36, L49 | ST-04, ST-13…16 не відтворюються black-box; лише через конкурентні запити або на рівні юніт-тестів |
| U-02 | `REJECTED` рецензентом: "`failing_gate` and `rejection_reason` are populated" (L52) — яке значення `failing_gate`, якщо жоден гейт не падав? Чи `note` стає `rejection_reason`? | L33, L52 | PC-02 для ST-06 не має очікуваного значення |
| U-03 | Код відповіді, коли approve/reject викликано без `X-Reviewer-Id`, або cancel — рецензентом (401? 403? 409?) | L32, L33, L35 | EP-C2, EP-C3, EP-E2 без expected status |
| U-04 | Код відповіді на reject без `note`; чи `""`/пробіли — валідний `note` | L33 | EP-D2, EP-D3 |
| U-05 | `Δ = 2 год` рівно — дозволено чи 409? Яка гранулярність порівняння (хв/с)? З яким часом порівнюється (час сервера на момент виклику)? | L38, L58–L60 | BV-01b |
| U-06 | Дедлайн 2 год стосується лише `APPROVED`? Чи `UNDER_REVIEW`/`DRAFT` можна скасувати після `window_start`? | L35, L37, L58 | EP-G4, EP-G5 |
| U-07 | Overlap — який гейт повертається: "inside the `AIRCRAFT` / `TIME_WINDOW` gates" (L64) — `failing_gate` = `AIRCRAFT` чи `TIME_WINDOW`? | L63–L65 | EP-H1, EP-H2: не можна асертити `failing_gate` |
| U-08 | `validate` згадано (L66), але не описано: чи дозволений у термінальних станах, чи повертає 409 | L66 | EP-H8 спирається на поведінку з іншого документа |
| U-09 | Пріоритет помилок: напр. reject без `note` на `APPROVED` — 409 чи помилка валідації? approve без `X-Reviewer-Id` на `COMPLETED` — 409 чи 401/403? | загальне | комбіновані негативні кейси без однозначного expected |
| U-10 | Хто може викликати maintenance completion endpoint і як він автентифікується | L34, L54 | ST-08 — потрібна пре-умова доступу |
| U-11 | Чи є дія `submit` для `REJECTED` (повторна подача після виправлення)? Специфікація каже 409 (L40) — підтвердити, що це бізнес-намір, а не прогалина | L40 | ST-22 |

---

## 7. Зведення покриття

| Техніка | Кількість | Примітка |
| --- | --- | --- |
| ST — клітинки матриці | 35 (+2 автоматичні) | 8 легальних, 27 нелегальних; 5 клітинок рядка `SUBMITTED` невідтворювані (U-01) |
| ST — шляхи | 7 | усі термінальні стани, усі легальні переходи |
| EP | 8 груп, 28 класів | A–H |
| BV | 1 числова межа (2 год) × трійка + межа `window_start` × трійка; 1 послідовнісна | BV-01, BV-02 |
| Пост-умови | 5 | PC-01…05 |
| Невідомі | 11 | U-01…11 |

Рекомендований пріоритет для першого прогону: P-01…P-06, ST-17 (re-submit `UNDER_REVIEW`, прямо названий у специфікації), ST-20/ST-21, ST-22…36 вибірково по одному на термінальний стан × шлях потрапляння, BV-01a/c, EP-F2, EP-H1…H6.
