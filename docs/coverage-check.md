# AgeTechX Berlin 2026 coverage check

Generated: 2026-10-05 14:30 Europe/Berlin (CEST).
Scope: reception tonight Clärchens Ballhaus + forum tomorrow Pfefferberg.
No outreach sent.

## Short summary for Fabian

- **Product / startup orgs affiliated with the event:** 45. **On our site index:** 19 (42.2%). **Missing from our index:** 26.
- **Ones to Watch Top 20:** 19/20 already on our landscape. Gap: **Plim** (Devanthro humanoid home robots; also coffee-break sponsor as Plim Robotics).
- **AgeTechX public market map page** currently renders **All Sectors (0)** (empty UI). Behind the scenes the org table has **21** rows with a `market_category` (usable as their map set). Several of those are **not** on our index (see below).
- **Bridge attendee directory** (`directories.brdg.app/view/agetechx--0a52558d`): **not fully readable**. View metadata loads (title "AgeTechX 2026", fields name/title/company/...), but **person records are empty under anon access** (RLS). WebFetch also returned a "View not found" shell. **Fallback used:** public "Who's Attending" roster on agetechx.com/tickets (richer than speakers alone), plus speakers API, Ones to Watch page, sponsors list, and Supabase orgs.
- **Biggest gaps for our landscape (product companies first):** Plim/Devanthro, OpenHealth Technologies, CARU, Elder, Robeauté, Meet5, Qida, Lifted, Khyaal, myo/Myosotis, voize, hesena, Refoxy, AMBOSS (edge), plus market-map-only names like Onfy, YEARS, Bayartis, BetterEstate, Parto, Lillian Care, microsynetics, Viola, MV.Health, Adsenia, CareFlick, Miina.
- **Investors / policy / operators** dominate the room (~200 seats). Those are mostly out of scope for the company index by design; listed separately so you can still see who is in the room for buyer questions (mkk, Korian, Kursana, Ahorn, hesena, Pflegehelden, Katharinenhof, etc.).

## Source readability

| Source | Readable? | What we got |
|---|---|---|
| Bridge directory agetechx--0a52558d | **Partial / blocked** | View config only; 0 person records via anon Supabase; SPA shell |
| agetechx.com/tickets "Who's Attending" | **Yes** | ~200 name+org pairs (public roster) |
| agetechx.com/ones-to-watch | **Yes** | Full Top 20 list |
| agetechx.com/speakers | Empty in static HTML | Speakers loaded via Supabase: **52** for Berlin 2026 |
| agetechx.com/market-map | UI shows 0 | DB: **33** orgs readable, **21** with market_category |
| agetechx.com/agenda | **Yes** | Sponsors (Patronus breakfast, Plim coffee, Henkel/LSE/Rubio/makesense afterparty) + speaker names |
| Luma luma.com/agetechx-berlin | **Partial** | Partners blurb + some speakers; guest list not public |
| Local site index.json | **Yes** | 56 companies, 75 ideas (generated 2026-10-05) |

## Counts

- Unique organisations extracted (all roles): **205**
- Classified as startup / product (priority coverage set): **45**
- Of those on our index: **19** (42.2%)
- Of those on AgeTechX market-map category set: **21**
- Of those missing from our index: **26**
- Ones to Watch on our index: **19/20**
- Sponsors/partners listed on site: **16** (product ones rarely on our index by design)
- Speaker companies: **50**

## Ones to Watch (Top 20) vs our index vs AgeTechX map

| Company | On our index | On AgeTechX market_category set | Notes |
|---|---|---|---|
| Amara | yes | no |  |
| AssistMe | yes | yes |  |
| auditect | yes | yes |  |
| caery | yes | no |  |
| cogvis | yes | no |  |
| dala.care | yes | no |  |
| Plim | **NO** | yes |  |
| Ditto | yes | no |  |
| Gardia | yes | no |  |
| Harmonica | yes | no | as Harmonica / Olympia |
| inTouch.family | yes | yes | as inTouch |
| Lateral | yes | no |  |
| livil | yes | no |  |
| Maurice & Nora | yes | no |  |
| navel robotics | yes | yes |  |
| Quantune | yes | no |  |
| SteffiCare | yes | no |  |
| TeiaCare | yes | no |  |
| Veli | yes | yes |  |
| Zenaris | yes | no |  |

## Sponsors and partners vs our index

| Org | Kind | On our index | On AgeTechX map set |
|---|---|---|---|
| NatWest Group | corporate_partner | no | no |
| Henkel | corporate_partner | no | no |
| mkk | corporate_partner | no | no |
| Heliad | investor | no | no |
| IDA Ireland | policy_media_ecosystem | no | no |
| Berlin Partner | policy_media_ecosystem | no | no |
| Dealroom | corporate_partner | no | no |
| Peak | investor | no | no |
| OpenHealth Technologies | startup | no | yes |
| German Bionic | corporate_partner | no | no |
| Patronus Group | startup | no | no |
| CARU | startup | no | yes |
| Plim | startup | no | yes |
| LSE | policy_media_ecosystem | no | no |
| Rubio Impact Ventures | investor | no | no |
| makesense | other | no | no |

## Missing from our site index (orgs first, prioritised)

Priority order: sponsors → Ones to Watch / exhibitors (none; event has no exhibition hall) → speakers' product companies → other attendee product orgs → operators → corporates → investors → other.

### 1. Sponsors / partners

- **Berlin Partner** (policy_media_ecosystem; roles: attendee_org, sponsor)
- **CARU** (startup; roles: attendee_org, market_map, speaker_company, sponsor) [on ATX map set]  -  https://caruhome.com  -  people: Dr. Susanne Dröscher
- **Dealroom** (corporate_partner; roles: sponsor)  -  https://dealroom.co
- **German Bionic** (corporate_partner; roles: attendee_org, speaker_company, sponsor)  -  people: Norma Steller
- **Heliad** (investor; roles: attendee_org, speaker_company, sponsor)  -  https://heliad.com  -  people: Julian Kappus
- **Henkel** (corporate_partner; roles: attendee_org, sponsor)
- **IDA Ireland** (policy_media_ecosystem; roles: attendee_org, sponsor)  -  https://ida.ie
- **LSE** (policy_media_ecosystem; roles: attendee_org, speaker_company, sponsor)  -  https://info.lse.ac.uk/staff/divisions/research-and-innovation/generate  -  people: Juliana Emmanuelli
- **makesense** (other; roles: sponsor)
- **mkk** (corporate_partner; roles: attendee_org, speaker_company, sponsor)  -  https://www.meine-krankenkasse.de/  -  people: Andreas Lenz
- **NatWest Group** (corporate_partner; roles: attendee_org, sponsor)
- **OpenHealth Technologies** (startup; roles: attendee_org, market_map, speaker_company, sponsor) [on ATX map set]  -  https://open-health.app  -  people: Gerrit Glass
- **Patronus Group** (startup; roles: attendee_org, speaker_company, sponsor)  -  https://www.patronus-group.com/  -  people: Ben Staudt
- **Peak** (investor; roles: attendee_org, speaker_company, sponsor)  -  https://peak.capital  -  people: Philippe von Klitzing; David Zwagemaker
- **Plim** (startup; roles: attendee_org, market_map, ones_to_watch, speaker_company, sponsor, startup) [on ATX map set]  -  https://devanthro.com  -  people: Rafael Hostettler
- **Rubio Impact Ventures** (investor; roles: attendee_org, speaker_company, sponsor)  -  https://www.rubio.vc/  -  people: Ilonka Jankovich

### 3. Speakers' companies (product)

- **AMBOSS** (startup; roles: attendee_org, speaker_company)  -  https://www.amboss.com  -  people: Dr. med. Sievert Weiss
- **JUNI** (startup; roles: attendee_org, speaker_company)  -  https://juni.science/  -  people: Hannah Payette Peterson
- **Khyaal** (startup; roles: attendee_org, speaker_company)  -  https://www.khyaal.com/  -  people: Hemanshu Jain
- **Lifted** (startup; roles: attendee_org, speaker_company)  -  https://www.lifted-talent.com/  -  people: Rachael Crook
- **Meet5** (startup; roles: attendee_org, speaker_company)  -  https://www.meet5.com/  -  people: Lukas Reinhardt
- **myo** (startup; roles: attendee_org, market_map, speaker_company) [on ATX map set]  -  https://myo-care.com/  -  people: Jasper Böckel
- **Qida** (startup; roles: attendee_org, speaker_company)  -  https://qida.es  -  people: Oriol Fuertes Cabassa
- **Refoxy** (startup; roles: attendee_org, speaker_company)  -  https://www.refoxy.com/  -  people: Dr. Victor Bustos
- **Robeauté** (startup; roles: attendee_org, market_map, speaker_company) [on ATX map set]  -  https://robeaute.com/  -  people: Bertrand Duplat
- **Silver Economy** (startup; roles: attendee_org, speaker_company)  -  https://silvereconomy.com/  -  people: Pedro Ros
- **voize** (startup; roles: attendee_org, speaker_company)  -  https://voize.ai  -  people: Lena Jäkel

### 4. On AgeTechX market_category set

- **Adsenia** (startup; roles: attendee_org, market_map) [on ATX map set]  -  https://fritz.re
- **Bayartis AG** (startup; roles: attendee_org, market_map) [on ATX map set]  -  https://bayartis.com
- **BetterEstate** (startup; roles: attendee_org, market_map) [on ATX map set]  -  https://betterestate.co
- **GmbH in Gründung** (startup; roles: market_map) [on ATX map set]
- **Lillian Care GmbH** (startup; roles: attendee_org, market_map) [on ATX map set]  -  https://lillian-care.de
- **microsynetics GmbH** (startup; roles: attendee_org, market_map) [on ATX map set]  -  https://microsynetics.de
- **MV.Health** (startup; roles: market_map) [on ATX map set]  -  https://mv.health/
- **Onfy GmbH** (startup; roles: attendee_org, market_map) [on ATX map set]  -  https://onfy.de
- **Parto Group GmbH** (startup; roles: attendee_org, market_map) [on ATX map set]  -  https://goparto.com
- **Viola** (startup; roles: market_map) [on ATX map set]  -  https://www.violacare.eu/
- **YEARS GmbH** (startup; roles: attendee_org, market_map) [on ATX map set]  -  https://years.co

### 6. Care operators / providers

- **Abbotsford Care / CoorieWell** (care_operator; roles: attendee_org)
- **Ahorn AG** (care_operator; roles: attendee_org)
- **Ahorn Gruppe** (care_operator; roles: attendee_org)
- **CareChoice** (care_operator; roles: attendee_org)
- **Chartwell Retirement Residences** (care_operator; roles: attendee_org)
- **CoorieWell** (care_operator; roles: attendee_org)
- **Dovida** (care_operator; roles: attendee_org)
- **Elder** (care_operator; roles: attendee_org, speaker_company)  -  https://www.elder.org/  -  people: Pete Dowds
- **Eldra Care AB** (care_operator; roles: attendee_org)
- **Erhol Care** (care_operator; roles: attendee_org)
- **Genesis Healthcare Ireland** (care_operator; roles: attendee_org)
- **hesena** (care_operator; roles: attendee_org, speaker_company)  -  people: Sascha Saßen
- **Hibernia Home Care** (care_operator; roles: attendee_org)
- **Island Healthcare Ltd** (care_operator; roles: attendee_org)
- **KATHARINENHOF Senioren Wohnanlage und Betriebs-GmbH** (care_operator; roles: attendee_org)
- **Korian** (care_operator; roles: attendee_org)
- **Kursana GmbH** (care_operator; roles: attendee_org)
- **Pflege ABC GmbH** (care_operator; roles: attendee_org)
- **Right at Home UK** (care_operator; roles: attendee_org)
- **Seniorendienste Stadt Hilden gGmbH** (care_operator; roles: attendee_org)

### 7. Corporate partners

- **AstraZeneca** (corporate_partner; roles: attendee_org)
- **Deutsche Bank** (corporate_partner; roles: attendee_org)
- **Hogan Lovells Cadwalader** (corporate_partner; roles: attendee_org, speaker_company)  -  https://hlc.com/  -  people: Thiemo Woertge
- **Sunstar** (corporate_partner; roles: attendee_org)

### 8. Investors / funds

- **Amino Collective** (investor; roles: attendee_org, speaker_company)  -  https://www.aminocollective.com/  -  people: Manuel Grossmann
- **Angel Invest** (investor; roles: attendee_org, speaker_company)  -  https://angelinvest.ventures/  -  people: Jag Singh
- **Auxxo Female Catalyst Fund** (investor; roles: attendee_org)
- **b2venture** (investor; roles: attendee_org)
- **Brandenburg Kapital** (investor; roles: attendee_org)
- **Care Venture Circle e.V.** (investor; roles: attendee_org)
- **Cherry Ventures** (investor; roles: attendee_org, speaker_company)  -  https://cherry.vc/  -  people: Christian Meermann
- **Citizen Capital** (investor; roles: attendee_org)
- **Deep Science Ventures** (investor; roles: attendee_org)
- **Equitage Ventures** (investor; roles: attendee_org)
- **European Investment Fund** (investor; roles: attendee_org, speaker_company)  -  people: Karine Cenci
- **FAST - IMPACT FUND** (investor; roles: attendee_org)
- **Fund F** (investor; roles: attendee_org)
- **Galion.exe** (investor; roles: attendee_org)
- **GoHub Ventures** (investor; roles: attendee_org)
- **Heal Capital** (investor; roles: attendee_org)
- **HV Capital** (investor; roles: attendee_org, speaker_company)  -  HV Capital  -  people: Lina Chong
- **Lifelong** (investor; roles: attendee_org, speaker_company)  -  people: Ricardo Oliveira Neves
- **LvlUp Ventures** (investor; roles: attendee_org)
- **Nextgen Ventures** (investor; roles: attendee_org)
- **Oyster Bay Venture Capital** (investor; roles: attendee_org)
- **Planet A** (investor; roles: attendee_org)
- **Point Nine** (investor; roles: attendee_org)
- **PROTOTYPE** (investor; roles: attendee_org, speaker_company)  -  https://www.prototypecap.com/  -  people: Andreas Klinger
- **Revent** (investor; roles: attendee_org, speaker_company)  -  https://www.revent.vc/  -  people: Otto Birnbaum
- **Ship2B Ventures SGEIC, S.A.** (investor; roles: attendee_org)
- **Springboard Health Angels GmbH** (investor; roles: attendee_org)
- **Vorwerk Ventures** (investor; roles: attendee_org)
- **West Tech Ventures GmbH** (investor; roles: attendee_org)
- **Wild Tree Ventures** (investor; roles: attendee_org)
- **Work In Progress Capital** (investor; roles: attendee_org)

### 9. Other (policy, media, services, misc)

- **ageas sa/nv** (other; roles: attendee_org)
- **AgeTechX** (other; roles: attendee_org, speaker_company)  -  https://agetechx.com/  -  people: Brian Daly
- **AIBŌ** (other; roles: attendee_org)
- **AIDAM** (other; roles: attendee_org)
- **amberra GmbH** (other; roles: attendee_org)
- **Badacare** (other; roles: attendee_org)
- **Bertelsmann Stiftung** (policy_media_ecosystem; roles: attendee_org, speaker_company)  -  https://www.bertelsmann-stiftung.de/de/startseite  -  people: André Schleiter
- **Breforth Communications** (other; roles: attendee_org)
- **Bureauvijftig** (other; roles: attendee_org)
- **Careflick** (other; roles: attendee_org)
- **Carepool** (other; roles: attendee_org)
- **Cerebrum DAO** (other; roles: attendee_org)
- **Charité** (policy_media_ecosystem; roles: attendee_org)
- **Christ & Company** (other; roles: attendee_org)
- **Createch Finland Association** (other; roles: attendee_org)
- **culinu** (other; roles: attendee_org)
- **Debating Europe** (policy_media_ecosystem; roles: attendee_org, speaker_company)  -  https://debatingeurope.eu/  -  people: Adam Nyman
- **Der Spiegel** (policy_media_ecosystem; roles: attendee_org, speaker_company)  -  https://www.spiegel.de/  -  people: Thomas Schulz
- **digital HEALTHCARE CONSULTING & TRAINING** (other; roles: attendee_org)
- **Domera Labs** (other; roles: attendee_org)
- **Eldra** (other; roles: attendee_org)
- **Embassy of Ireland, Germany** (policy_media_ecosystem; roles: attendee_org, speaker_company)  -  https://www.ireland.ie/en/germany/berlin/about/ambassador/  -  people: Ambassador Maeve Collins
- **enna systems GmbH** (other; roles: attendee_org)
- **Erhol** (other; roles: attendee_org)
- **Ernst & Young** (other; roles: attendee_org)
- **Familiara GmbH** (other; roles: attendee_org)
- **Family Bridge // Kaleido** (other; roles: attendee_org)
- **Famplus** (other; roles: attendee_org)
- **Forward Health GmbH** (other; roles: attendee_org)
- **FSVV GmbH** (other; roles: attendee_org)
- **Galeneo Health** (other; roles: attendee_org)
- **GetSetUp** (other; roles: attendee_org)
- **Globogate concept AG** (other; roles: attendee_org)
- **GMPVC German Media Pool** (other; roles: attendee_org)
- **Good Life Sorted** (other; roles: attendee_org)
- **Goplaces.club** (other; roles: attendee_org)
- **Gripwise Tech, Lda** (other; roles: attendee_org)
- **Gå&Må** (other; roles: attendee_org)
- **hellomed group GmbH** (other; roles: attendee_org)
- **Helsana Insurance Company** (other; roles: attendee_org)
- **HUM Systems GmbH** (other; roles: attendee_org)
- **Hypofriend** (other; roles: attendee_org)
- **IDA** (other; roles: attendee_org)
- **IVOXEN GmbH** (other; roles: attendee_org)
- **Kin.** (other; roles: attendee_org)
- **KissUX** (other; roles: attendee_org)
- **Liacare** (other; roles: attendee_org)
- **Miina** (other; roles: attendee_org)
- **MIT AgeLab and Scottish Care** (policy_media_ecosystem; roles: attendee_org)
- **Moat Studio** (other; roles: attendee_org)
- **Momo Medical** (other; roles: attendee_org)
- **MunAI** (other; roles: attendee_org)
- **nearby (TrackTech GmbH)** (other; roles: attendee_org)
- **Neare** (other; roles: attendee_org)
- **Nemlia** (other; roles: attendee_org)
- **Next Step Dynamics AB** (other; roles: attendee_org)
- **Nila** (other; roles: attendee_org)
- **Ninacare** (other; roles: attendee_org)
- **NOX AAL Technologies** (other; roles: attendee_org)
- **OECD** (policy_media_ecosystem; roles: attendee_org, speaker_company)  -  https://www.oecd.org/en.html  -  people: Dr. Monika Queisser
- **Omoi One AB** (other; roles: attendee_org)
- **Optimens** (other; roles: attendee_org)
- **PacSana** (other; roles: attendee_org)
- **Parto** (other; roles: attendee_org)
- **PAVA** (other; roles: attendee_org)
- **Pflegehelden Franchise GmbH** (other; roles: attendee_org)
- **Pilotfish Berlin GmbH** (other; roles: attendee_org)
- **Pleeg GmbH** (other; roles: attendee_org)
- **Proteso Srl** (other; roles: attendee_org)
- **PulpDigital.ai** (other; roles: attendee_org)
- **R4 GmbH** (other; roles: attendee_org)
- **Realise Longevity** (other; roles: attendee_org)
- **Remind** (other; roles: attendee_org)
- **RenteNavi** (other; roles: attendee_org)
- **Sana Kliniken** (policy_media_ecosystem; roles: attendee_org)
- **Sanii** (other; roles: attendee_org)
- **Scottish Care** (policy_media_ecosystem; roles: attendee_org, speaker_company)  -  https://scottishcare.org/  -  people: Elisa Cardamone; Dr. Donald Macaskill
- **sendance GmbH** (other; roles: attendee_org)
- **SeniorMarket** (other; roles: attendee_org)
- **Tabea Diakonie - Pflegedienst gGmbH** (other; roles: attendee_org)
- **Tagesspiegel** (policy_media_ecosystem; roles: attendee_org)
- **Telegrafik** (other; roles: attendee_org)
- **Tendertec** (other; roles: attendee_org)
- **TERN Group** (other; roles: attendee_org)
- **Tinybots** (other; roles: attendee_org)
- **U2V** (other; roles: attendee_org)
- **UPtastic GmbH** (other; roles: attendee_org)
- **Valkor Robotics** (other; roles: attendee_org)
- **Volt Berlin** (policy_media_ecosystem; roles: speaker_company)  -  https://www.volt.eu/  -  people: Anna Auerbach
- **Wohnen im Alter Internet GmbH** (other; roles: attendee_org)
- **World Pensions** (policy_media_ecosystem; roles: attendee_org)
- **World Pensions Council** (policy_media_ecosystem; roles: speaker_company)  -  https://worldpensions.org/  -  people: Nicolas Firzli

## Speaker individuals whose org is missing from our index

The landscape tracks companies/ideas, not people. Flagged when the speaker's company is not on our index.

- **Dr. med. Sievert Weiss** (Co-Founder and Director of Medical) @ **AMBOSS**  -  org missing from our index
- **Brian Daly** (Founder) @ **AgeTechX**  -  org missing from our index
- **Dr. Susanne Dröscher** (Co-CEO) @ **CARU**  -  org missing from our index [on ATX map set]
- **Rafael Hostettler** (Founder & CEO) @ **Devanthro**  -  org missing from our index [on ATX map set]
- **Hannah Payette Peterson** (Scientist) @ **JUNI**  -  org missing from our index
- **Hemanshu Jain** (Founder & CEO) @ **Khyaal**  -  org missing from our index
- **Rachael Crook** (Co-Founder & CEO) @ **Lifted**  -  org missing from our index
- **Lukas Reinhardt** (Co-Founder and CEO) @ **Meet5**  -  org missing from our index
- **Gerrit Glass** (Founder & CEO) @ **OpenHealth Technologies**  -  org missing from our index [on ATX map set]
- **Ben Staudt** (Founder and Managing Director) @ **Patronus Group**  -  org missing from our index
- **Oriol Fuertes Cabassa** (Co-founder and CEO) @ **Qida**  -  org missing from our index
- **Dr. Victor Bustos** (Co-Founder and CEO) @ **Refoxy**  -  org missing from our index
- **Bertrand Duplat** (Co-Founder and CEO) @ **Robeauté**  -  org missing from our index [on ATX map set]
- **Pedro Ros** (Founder) @ **Silver Economy**  -  org missing from our index
- **Jasper Böckel** (Co-Founder and CEO) @ **myo**  -  org missing from our index [on ATX map set]
- **Lena Jäkel** (Director of Marketing) @ **voize**  -  org missing from our index

### Speakers at investor / policy / corporate orgs (org not expected on product index)

- Manuel Grossmann @ Amino Collective (investor)
- Jag Singh @ Angel Invest (investor)
- Andreas Lenz @ BKK Pfalz (corporate_partner)
- André Schleiter @ Bertelsmann Stiftung (policy_media_ecosystem)
- Christian Meermann @ Cherry Ventures (investor)
- Adam Nyman @ Debating Europe (policy_media_ecosystem)
- Thomas Schulz @ Der Spiegel (policy_media_ecosystem)
- Pete Dowds @ Elder (care_operator)
- Ambassador Maeve Collins @ Embassy of Ireland, Germany (policy_media_ecosystem)
- Karine Cenci @ European Investment Fund (investor)
- Norma Steller @ German Bionic (corporate_partner)
- Lina Chong @ HV Capital (investor)
- Julian Kappus @ Heliad (investor)
- Thiemo Woertge @ Hogan Lovells Cadwalader (corporate_partner)
- Juliana Emmanuelli @ LSE Generate (policy_media_ecosystem)
- Ricardo Oliveira Neves @ Lifelong (investor)
- Dr. Monika Queisser @ OECD (policy_media_ecosystem)
- Andreas Klinger @ PROTOTYPE (investor)
- David Zwagemaker @ Peak Capital (investor)
- Philippe von Klitzing @ Peak Capital (investor)
- Otto Birnbaum @ Revent (investor)
- Ilonka Jankovich @ Rubio Impact Ventures (investor)
- Dr. Donald Macaskill @ Scottish Care (policy_media_ecosystem)
- Elisa Cardamone @ Scottish Care (policy_media_ecosystem)
- Anna Auerbach @ Volt Berlin (policy_media_ecosystem)
- Nicolas Firzli @ World Pensions Council (policy_media_ecosystem)
- Sascha Saßen @ hesena (care_operator)

## AgeTechX market_category set vs our index

| Org | market_category | On our index |
|---|---|---|
| Adsenia | Other | **NO** |
| AssistMe GmbH | Care Technology | yes |
| auditect GmbH | Smart Home & Assisted Living | yes |
| Bayartis GmbH | Digital Health & Telehealth | **NO** |
| BetterEstate | FinTech & Insurance | **NO** |
| CARU | Care Technology | **NO** |
| GmbH in Gründung | Other | **NO** |
| inTouch | Cognitive Health | yes |
| Lillian Care GmbH | Care Tech | **NO** |
| microsynetics GmbH | Care Technology | **NO** |
| MV.Health | At-home Uro/Gyn Medical Devices | **NO** |
| Myosotis GmbH | Smart Home & Assisted Living | **NO** |
| navel robotics GmbH | Senior Living - Resident Engagement | yes |
| Onfy GmbH | AgeTech Marketplace | **NO** |
| OpenHealth Technologies | Digital Health & Telehealth | **NO** |
| Parto Group GmbH | Care Tech | **NO** |
| Plim | Care Technology | **NO** |
| Robeauté | robotics_assistive | **NO** |
| Veli GmbH | Smart Home & Assisted Living | yes |
| Viola | Marketplace | **NO** |
| YEARS GmbH | Digital Health & Telehealth | **NO** |

## Method notes

- Deduped by normalised name (strip GmbH/AG/Ltd, alias Plim↔Devanthro, mkk↔BKK Pfalz, Harmonica↔Olympia, Myosotis↔myo, etc.).
- "On AgeTechX market map" = org has non-null `market_category` in AgeTechX Supabase `organizations` (the public /market-map page currently shows 0 sectors; treat DB set as the real map inventory).
- "On our site index" = match against `/home/box/shared/fabian-second-brain/02_venture_building/agetech-continuum/site/data/index.json` company entries (56).
- Event explicitly has **no exhibition hall**; "exhibitors" N/A. Ones to Watch + sponsors fill that slot.
- Bridge directory remains the gap for a full attendee×company dump; tickets roster is the best public substitute.

## Suggested next adds to our landscape (product only, short list)

- Plim (Devanthro)
- OpenHealth Technologies
- CARU
- Elder
- Robeauté
- Meet5
- Qida
- Lifted
- Khyaal
- myo / Myosotis
- voize
- hesena
- Refoxy
- Onfy
- YEARS
- Bayartis
- BetterEstate
- Parto Group
- Lillian Care
- microsynetics
- Viola
- MV.Health
- Adsenia
- CareFlick
- Miina
- enna systems
- Ninacare
- Telegrafik
- Momo Medical
- Tinybots
- sendance
- AIBŌ
- PacSana
- Domera Labs
- nearby / TrackTech
