import assert from "node:assert/strict";
import test from "node:test";
import { attachFunding, funderDetail, funderSummary, parseAmount, parseSources } from "./funders-shape.js";

test("sources keep url and quote and drop anything else", () => {
  const sources = parseSources(JSON.stringify([
    { url: "https://example.com/a", quote: " a line " },
    { url: "notaurl", quote: "no" },
    { url: "https://example.com/b" },
  ]));
  assert.deepEqual(sources, [
    { url: "https://example.com/a", quote: "a line" },
    { url: "https://example.com/b" },
  ]);
});

test("amount stays a number or null", () => {
  assert.equal(parseAmount("6600000"), 6600000);
  assert.equal(parseAmount(null), null);
  assert.equal(parseAmount("nope"), null);
});

test("funder list row keeps the published company count", () => {
  assert.deepEqual(funderSummary({
    id: "heliad",
    name: "Heliad",
    kind: "evergreen_or_listed",
    country: "DE",
    backed: "0",
  }), {
    id: "heliad",
    name: "Heliad",
    kind: "evergreen_or_listed",
    country: "DE",
    operator: null,
    amount_range: null,
    eligibility_stage: null,
    next_deadline: null,
    dilution: null,
    backed: 0,
  });
});

test("funder facts stay text and blank fields stay null", () => {
  const summary = funderSummary({
    id: "exist-gruenderstipendium",
    name: "EXIST Gründerstipendium",
    kind: "grant_programme",
    country: "DE",
    operator: " BMWE ",
    amount_range: "1,000-3,000 EUR/month",
    eligibility_stage: "pre-company",
    next_deadline: "rolling",
    dilution: "non_dilutive",
    backed: 0,
  });
  assert.equal(summary.operator, "BMWE");
  assert.equal(summary.dilution, "non_dilutive");
  assert.equal(summary.next_deadline, "rolling");
  const detail = funderDetail({
    id: "exist-gruenderstipendium",
    name: "EXIST Gründerstipendium",
    kind: "grant_programme",
    country: "DE",
    website: "https://example.com",
    description: "Grant.",
    aum_or_programme_size: null,
    care_focus: "",
    operator: "BMWE",
    amount_range: "",
    eligibility: " Students ",
    eligibility_stage: "pre-company",
    next_deadline: "rolling",
    dilution: "non_dilutive",
    sources: "[]",
  }, []);
  assert.equal(detail.eligibility, "Students");
  assert.equal(detail.amount_range, null);
  assert.equal(detail.dilution, "non_dilutive");
});

test("funder detail lists only the backed rows it is given", () => {
  const detail = funderDetail({
    id: "almaz-capital",
    name: "Almaz Capital",
    kind: "vc",
    country: "US",
    website: "https://almaz.capital",
    description: "Investor.",
    aum_or_programme_size: null,
    care_focus: "",
    sources: "[]",
  }, [{
    entry_id: "company-marta",
    entry_name: "Marta",
    relation: "equity_round",
    round_label: "Seed",
    amount_eur: "6600000",
    date: "2022-08-01",
    sources: [{ url: "https://example.com/marta", quote: "raised" }],
  }]);
  assert.equal(detail.care_focus, null);
  assert.equal(detail.backed.length, 1);
  assert.equal(detail.backed[0].amount_eur, 6600000);
  assert.equal(detail.backed[0].date, "2022-08-01");
});

test("index entries gain funded_by only when a link exists", () => {
  const index = attachFunding({
    entries: [
      { id: "company-voize", name: "voize" },
      { id: "company-cera", name: "Cera" },
    ],
  }, [{
    entry_id: "company-voize",
    funder_id: "balderton",
    funder_name: "Balderton Capital",
    relation: "lead_investor",
    round_label: "Series A",
    amount_eur: null,
    date: "2025-11-17",
    sources: [],
  }]);
  assert.equal(index.entries[0].funded_by[0].id, "balderton");
  assert.equal(index.entries[0].funded_by[0].date, "2025-11-17");
  assert.equal(index.entries[1].funded_by, undefined);
});
