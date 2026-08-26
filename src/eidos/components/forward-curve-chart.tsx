"use client";

/**
 * EIDOS Futures Opportunity — forward curve chart using D3.
 * Visualises the full forward curve and highlights the target contract.
 */

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { ForwardCurvePoint } from "@/eidos/types/futures";

interface ForwardCurveChartProps {
  points: ForwardCurvePoint[];
  targetContract: string;
  height?: number;
}

export function ForwardCurveChart({
  points,
  targetContract,
  height = 260,
}: ForwardCurveChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const el = svgRef.current;
    d3.select(el).selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const totalWidth = el.clientWidth || 600;
    const width = totalWidth - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const quarterly = points
      .filter((p) => p.contract.startsWith("Q"))
      .sort((a, b) => a.deliveryOrdinal - b.deliveryOrdinal);

    const annuals = points
      .filter((p) => p.contract.startsWith("Cal"))
      .sort((a, b) => a.deliveryOrdinal - b.deliveryOrdinal);

    const allPrices = points.map((p) => p.price);
    const minPrice = (d3.min(allPrices) ?? 380) - 20;
    const maxPrice = (d3.max(allPrices) ?? 540) + 20;

    const xScale = d3
      .scaleLinear()
      .domain([
        d3.min(quarterly, (p) => p.deliveryOrdinal) ?? 1,
        d3.max(quarterly, (p) => p.deliveryOrdinal) ?? 10,
      ])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([minPrice, maxPrice])
      .range([h, 0]);

    const svg = d3
      .select(el)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines
    svg
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => ""),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll("line").attr("stroke", "#3f3f46").attr("stroke-dasharray", "3,3"),
      );

    // Quarterly line
    const line = d3
      .line<ForwardCurvePoint>()
      .x((d) => xScale(d.deliveryOrdinal))
      .y((d) => yScale(d.price))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(quarterly)
      .attr("fill", "none")
      .attr("stroke", "#71717a")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Annual markers
    svg
      .selectAll(".annual-dot")
      .data(annuals)
      .join("circle")
      .attr("class", "annual-dot")
      .attr("cx", (d) => xScale(d.deliveryOrdinal))
      .attr("cy", (d) => yScale(d.price))
      .attr("r", 5)
      .attr("fill", "#7c3aed")
      .attr("opacity", 0.7);

    // Quarterly dots
    svg
      .selectAll(".q-dot")
      .data(quarterly)
      .join("circle")
      .attr("class", "q-dot")
      .attr("cx", (d) => xScale(d.deliveryOrdinal))
      .attr("cy", (d) => yScale(d.price))
      .attr("r", (d) => (d.contract === targetContract ? 8 : 4))
      .attr("fill", (d) =>
        d.contract === targetContract ? "#10b981" : "#a1a1aa",
      )
      .attr("stroke", (d) =>
        d.contract === targetContract ? "#6ee7b7" : "none",
      )
      .attr("stroke-width", 2);

    // Target label
    const target = quarterly.find((p) => p.contract === targetContract);
    if (target) {
      svg
        .append("text")
        .attr("x", xScale(target.deliveryOrdinal))
        .attr("y", yScale(target.price) - 14)
        .attr("text-anchor", "middle")
        .attr("fill", "#10b981")
        .attr("font-size", 11)
        .attr("font-weight", "bold")
        .text(target.contract);
    }

    // Price labels for quarterly dots
    svg
      .selectAll(".q-label")
      .data(quarterly)
      .join("text")
      .attr("class", "q-label")
      .attr("x", (d) => xScale(d.deliveryOrdinal))
      .attr("y", (d) => yScale(d.price) - (d.contract === targetContract ? 24 : 12))
      .attr("text-anchor", "middle")
      .attr("fill", "#71717a")
      .attr("font-size", 10)
      .text((d) => (d.contract === targetContract ? "" : d.price.toFixed(0)));

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${h})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(quarterly.length)
          .tickFormat((_d, i) => quarterly[i]?.contract ?? ""),
      )
      .call((g) => g.select(".domain").attr("stroke", "#52525b"))
      .call((g) => g.selectAll("line").attr("stroke", "#52525b"))
      .call((g) =>
        g
          .selectAll("text")
          .attr("fill", "#a1a1aa")
          .attr("font-size", 10)
          .attr("transform", "rotate(-35)")
          .attr("text-anchor", "end"),
      );

    svg
      .append("g")
      .call(d3.axisLeft(yScale).ticks(6).tickFormat((d) => `${d}`))
      .call((g) => g.select(".domain").attr("stroke", "#52525b"))
      .call((g) => g.selectAll("line").attr("stroke", "#52525b"))
      .call((g) => g.selectAll("text").attr("fill", "#a1a1aa").attr("font-size", 10));

    // Y-axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -h / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#71717a")
      .attr("font-size", 11)
      .text("PLN/MWh");

    // Legend
    const legend = svg.append("g").attr("transform", `translate(0, ${h + 46})`);
    legend
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 5)
      .attr("fill", "#10b981");
    legend
      .append("text")
      .attr("x", 10)
      .attr("y", 4)
      .attr("fill", "#a1a1aa")
      .attr("font-size", 10)
      .text("Target contract");
    legend
      .append("circle")
      .attr("cx", 110)
      .attr("cy", 0)
      .attr("r", 5)
      .attr("fill", "#7c3aed")
      .attr("opacity", 0.7);
    legend
      .append("text")
      .attr("x", 120)
      .attr("y", 4)
      .attr("fill", "#a1a1aa")
      .attr("font-size", 10)
      .text("Annual (Cal)");
  }, [points, targetContract, height]);

  return (
    <div data-testid="forward-curve-chart" className="w-full">
      <svg
        ref={svgRef}
        width="100%"
        height={height + 20}
        aria-label="Forward curve chart"
      />
    </div>
  );
}
