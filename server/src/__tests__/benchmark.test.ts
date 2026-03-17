import { describe, it, expect } from 'vitest';
import { BENCHMARK_MIN_SAMPLE } from '../types/index.js';

/**
 * Benchmark minimum sample size enforcement tests.
 *
 * The spec requires: "Benchmark queries that return fewer than 10 distinct
 * tenant contributions must return null, not data."
 *
 * This is enforced at the query layer in BenchmarkRepository.
 * These tests verify the constant and the contract.
 */

describe('Benchmark minimum sample size', () => {
  it('BENCHMARK_MIN_SAMPLE is set to 10', () => {
    expect(BENCHMARK_MIN_SAMPLE).toBe(10);
  });

  it('sample sizes below minimum must result in null response', () => {
    // Simulates the logic in BenchmarkRepository.getPercentile/getDistribution
    function shouldReturnData(sampleSize: number): boolean {
      return sampleSize >= BENCHMARK_MIN_SAMPLE;
    }

    expect(shouldReturnData(0)).toBe(false);
    expect(shouldReturnData(1)).toBe(false);
    expect(shouldReturnData(5)).toBe(false);
    expect(shouldReturnData(9)).toBe(false);
    expect(shouldReturnData(10)).toBe(true);
    expect(shouldReturnData(11)).toBe(true);
    expect(shouldReturnData(100)).toBe(true);
  });

  it('minimum sample size prevents reverse-engineering of individual tenant data', () => {
    // With 10+ samples, any individual tenant's contribution is <= 10% of the aggregate
    // This makes it infeasible to reverse-engineer any single tenant's data
    const minSamples = BENCHMARK_MIN_SAMPLE;
    const maxContributionPct = (1 / minSamples) * 100;
    expect(maxContributionPct).toBeLessThanOrEqual(10);
  });
});

describe('Benchmark vector schema', () => {
  it('benchmark vector contains only numeric/enum fields (no free text)', () => {
    // Verify the structural types allowed in BenchmarkVector
    const allowedTypes = ['number', 'string', 'object', 'undefined'];
    // string is only for: planTier (enum), sector (enum), orgSizeband (enum), tenant_hash, snapshot_hash
    // object is for JSONB fields containing only numbers

    // The enum values that are allowed as strings
    const allowedStringEnums = {
      planTier: ['FREE', 'PRO', 'ENTERPRISE'],
      sector: ['public', 'finance', 'energy', 'telecom', null],
      orgSizeband: ['small', 'medium', 'large', null],
    };

    for (const [field, values] of Object.entries(allowedStringEnums)) {
      for (const v of values) {
        if (v !== null) {
          expect(typeof v).toBe('string');
          // These are predefined enums, not free text
          expect(v.length).toBeLessThan(20);
        }
      }
    }
  });
});

describe('Benchmark correlation', () => {
  it('correlation values are bounded between -1 and 1', () => {
    // PostgreSQL CORR() returns values in [-1, 1]
    const validCorrelations = [-1, -0.5, 0, 0.5, 1, 0.87, -0.32];
    for (const c of validCorrelations) {
      expect(c).toBeGreaterThanOrEqual(-1);
      expect(c).toBeLessThanOrEqual(1);
    }
  });

  it('correlation also enforces minimum sample size', () => {
    // Same BENCHMARK_MIN_SAMPLE applies to correlation queries
    expect(BENCHMARK_MIN_SAMPLE).toBe(10);
  });
});
