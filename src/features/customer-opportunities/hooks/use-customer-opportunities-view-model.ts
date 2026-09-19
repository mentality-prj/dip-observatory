"use client";

import { useMemo, useState } from "react";
import { parseCustomerCsv, type Customer } from "../model/csv";
import type { CustomerOpportunityEvaluation } from "../model/contracts";
import { evaluateCustomerOpportunities } from "../services/evaluate-customer-opportunities";

export function useCustomerOpportunitiesViewModel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [data, setData] = useState<CustomerOpportunityEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const visibleResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!data) return [];
    if (!normalizedQuery) return data.results;
    return data.results.filter((result) =>
      result.company_name.toLowerCase().includes(normalizedQuery),
    );
  }, [data, query]);

  async function loadFile(file: File) {
    try {
      setError(null);
      setData(null);
      setCustomers(parseCustomerCsv(await file.text()));
    } catch (cause) {
      setCustomers([]);
      setError(cause instanceof Error ? cause.message : "Invalid CSV");
    }
  }

  async function evaluate() {
    if (!customers.length || loading) return;
    setLoading(true);
    setError(null);
    try {
      setData(await evaluateCustomerOpportunities(customers));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "DIP evaluation failed");
    } finally {
      setLoading(false);
    }
  }

  return {
    customerCount: customers.length,
    data,
    error,
    loading,
    query,
    visibleResults,
    setQuery,
    loadFile,
    evaluate,
  };
}

export type CustomerOpportunitiesViewModel = ReturnType<
  typeof useCustomerOpportunitiesViewModel
>;
