"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

import { STRATEGY_LABEL } from "@/eidos/lib/eidos-format";
import type {
  ProcurementStrategy,
  StrategyEvaluation,
} from "@/eidos/types/eidos";

type Props = {
  evaluations: StrategyEvaluation[];
  recommendedStrategy: ProcurementStrategy;
};

const WIDTH = 520;
const HEIGHT = 320;
const MARGIN = { top: 24, right: 28, bottom: 52, left: 68 };

export function DecisionTradeoffChart({
  evaluations,
  recommendedStrategy,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);

    const costs = evaluations.map((item) => item.expectedCost);
    const costMin = Math.min(...costs);
    const costMax = Math.max(...costs);
    const costPad = Math.max((costMax - costMin) * 0.25, costMax * 0.02, 1);

    const xScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([MARGIN.left, WIDTH - MARGIN.right]);
    const yScale = d3
      .scaleLinear()
      .domain([costMin - costPad, costMax + costPad])
      .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

    // Gridlines.
    svg
      .append("g")
      .selectAll("line")
      .data(xScale.ticks(5))
      .join("line")
      .attr("x1", (tick) => xScale(tick))
      .attr("x2", (tick) => xScale(tick))
      .attr("y1", MARGIN.top)
      .attr("y2", HEIGHT - MARGIN.bottom)
      .attr("stroke", "rgba(148,163,184,0.12)")
      .attr("stroke-dasharray", "4 8");

    // Axes.
    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((tick) => `${Math.round(Number(tick) * 100)}%`);
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((tick) => d3.format(".2s")(Number(tick)).replace("G", "B"));

    svg
      .append("g")
      .attr("transform", `translate(0,${HEIGHT - MARGIN.bottom})`)
      .call(xAxis)
      .call((group) => group.selectAll("text").attr("fill", "#94a3b8"))
      .call((group) => group.selectAll("line,path").attr("stroke", "rgba(148,163,184,0.3)"));
    svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},0)`)
      .call(yAxis)
      .call((group) => group.selectAll("text").attr("fill", "#94a3b8"))
      .call((group) => group.selectAll("line,path").attr("stroke", "rgba(148,163,184,0.3)"));

    // Axis titles.
    svg
      .append("text")
      .attr("x", (MARGIN.left + WIDTH - MARGIN.right) / 2)
      .attr("y", HEIGHT - 12)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 12)
      .text("Risk →");
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(MARGIN.top + HEIGHT - MARGIN.bottom) / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 12)
      .text("Expected cost →");

    // Points.
    const points = svg
      .append("g")
      .selectAll("g")
      .data(evaluations)
      .join("g")
      .attr(
        "transform",
        (d) => `translate(${xScale(d.riskValue)},${yScale(d.expectedCost)})`,
      );

    points
      .append("circle")
      .attr("r", (d) => (d.strategy === recommendedStrategy ? 11 : 8))
      .attr("fill", (d) =>
        d.strategy === recommendedStrategy
          ? "rgba(34,211,238,0.9)"
          : "rgba(148,163,184,0.55)",
      )
      .attr("stroke", (d) =>
        d.strategy === recommendedStrategy ? "#67e8f9" : "#cbd5e1",
      )
      .attr("stroke-width", 1.5);

    points
      .append("text")
      .attr("y", -16)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", 12)
      .attr("font-weight", 600)
      .text((d) => STRATEGY_LABEL[d.strategy]);
  }, [evaluations, recommendedStrategy]);

  return (
    <figure className="m-0">
      <svg
        ref={svgRef}
        role="img"
        aria-label={`Cost versus risk trade-off. ${evaluations
          .map(
            (item) =>
              `${STRATEGY_LABEL[item.strategy]}: risk ${Math.round(
                item.riskValue * 100,
              )}%`,
          )
          .join(", ")}. Recommended: ${STRATEGY_LABEL[recommendedStrategy]}.`}
        className="w-full"
      />
      <figcaption className="mt-1 text-xs text-slate-500">
        Each point is one alternative. Down-left is cheaper and safer; the
        recommended option balances cost against risk.
      </figcaption>
    </figure>
  );
}
