import { describe, expect, it } from "vitest"
import { calcSalary, inr, PAY_MATRIX_7 } from "@/lib/tools/pay-matrix"

describe("PAY_MATRIX_7", () => {
  it("has 18 increasing levels", () => {
    expect(PAY_MATRIX_7).toHaveLength(18)
    for (let i = 1; i < PAY_MATRIX_7.length; i++) expect(PAY_MATRIX_7[i].basic7).toBeGreaterThan(PAY_MATRIX_7[i - 1].basic7)
  })
})

describe("calcSalary", () => {
  it("computes a level-6 salary in an X city with no tax under the rebate", () => {
    expect(calcSalary({ basic: 35400, daPct: 50, cityClass: "X" })).toEqual({
      basic: 35400,
      da: 17700,
      hra: 9558,
      ta: 5400,
      gross: 68058,
      nps: 5310,
      cghs: 250,
      cgegis: 60,
      incomeTaxMonthly: 0,
      net: 62438,
    })
  })

  it("applies new-regime slabs above the rebate limit", () => {
    const s = calcSalary({ basic: 144200, daPct: 0, cityClass: "Z" })
    expect(s.hra).toBe(12978)
    expect(s.gross).toBe(160778)
    expect(s.cghs).toBe(650)
    expect(s.cgegis).toBe(120)
    expect(s.incomeTaxMonthly).toBe(14239)
    expect(s.net).toBe(131349)
  })

  it("uses the Y-city HRA and mid CGHS slab", () => {
    const s = calcSalary({ basic: 47600, daPct: 0, cityClass: "Y", taBase: 0, npsPct: 0 })
    expect(s).toMatchObject({ hra: 8568, ta: 0, nps: 0, cghs: 325, cgegis: 60 })
  })

  it("formats rupees", () => {
    expect(inr(125000.4)).toBe("₹1,25,000")
  })
})
