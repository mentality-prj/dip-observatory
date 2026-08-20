"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import * as d3 from "d3";

import type { StateSpaceTrajectory } from "@/lib/observatory-derive";
import type { ObservatoryCopy } from "@/lib/observatory-i18n";
import { cn } from "@/lib/utils";

type Props = {
  trajectories: StateSpaceTrajectory[];
  selectedAlternativeId: string | null;
  status: "idle" | "loading" | "success" | "error";
  hasRun: boolean;
  revealStep: number;
  axisLabels: {
    x: string;
    y: string;
  } | null;
  copy: ObservatoryCopy;
  onSelect: (alternativeId: string) => void;
};

export function StateSpaceChart({
  trajectories,
  selectedAlternativeId,
  status,
  hasRun,
  revealStep,
  axisLabels,
  copy,
  onSelect,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  // persist scales and chart group between the two effects
  const chartRef = useRef<d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  > | null>(null);
  const scalesRef = useRef<{
    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;
    margin: { top: number; right: number; bottom: number; left: number };
  } | null>(null);
  // ref so Effect 2 always has latest trajectories without being in its deps
  const trajectoriesRef = useRef<typeof trajectories>([]);
  // useLayoutEffect runs synchronously before paint — safe for ref sync
  useLayoutEffect(() => {
    trajectoriesRef.current = trajectories;
  });

  // Effect 1: draw static background, grid, and axes once per trajectory set
  useEffect(() => {
    if (!svgRef.current) return;

    const width = 960;
    const height = 520;
    const margin = { top: 36, right: 44, bottom: 62, left: 62 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const chart = svg.append("g");
    chartRef.current = chart;

    chart
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("rx", 28)
      .attr("fill", "rgba(8, 12, 24, 0.84)");

    const xScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([margin.left, width - margin.right]);
    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom, margin.top]);
    scalesRef.current = { x: xScale, y: yScale, margin };

    const xTicks = xScale.ticks(5);
    const yTicks = yScale.ticks(5);

    chart
      .append("g")
      .selectAll("line")
      .data(xTicks)
      .join("line")
      .attr("x1", (tick: number) => xScale(tick))
      .attr("x2", (tick: number) => xScale(tick))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "rgba(148, 163, 184, 0.12)")
      .attr("stroke-dasharray", "4 8");

    chart
      .append("g")
      .selectAll("line")
      .data(yTicks)
      .join("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", (tick: number) => yScale(tick))
      .attr("y2", (tick: number) => yScale(tick))
      .attr("stroke", "rgba(148, 163, 184, 0.12)")
      .attr("stroke-dasharray", "4 8");

    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((tick) => `${Math.round(Number(tick) * 100)}%`);
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((tick) => `${Math.round(Number(tick) * 100)}%`);

    chart
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .call((group: d3.Selection<SVGGElement, unknown, null, undefined>) => {
        group
          .selectAll("path,line")
          .attr("stroke", "rgba(148, 163, 184, 0.18)");
        group
          .selectAll("text")
          .attr("fill", "rgba(203, 213, 225, 0.85)")
          .attr("font-size", 12);
      });

    chart
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis)
      .call((group: d3.Selection<SVGGElement, unknown, null, undefined>) => {
        group
          .selectAll("path,line")
          .attr("stroke", "rgba(148, 163, 184, 0.18)");
        group
          .selectAll("text")
          .attr("fill", "rgba(203, 213, 225, 0.85)")
          .attr("font-size", 12);
      });

    chart
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 18)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(226, 232, 240, 0.84)")
      .attr("font-size", 12)
      .attr("letter-spacing", "0.22em")
      .text(axisLabels?.x ?? copy.chart.axisFallbackX);

    chart
      .append("text")
      .attr("transform", `translate(18, ${height / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(226, 232, 240, 0.84)")
      .attr("font-size", 12)
      .attr("letter-spacing", "0.22em")
      .text(axisLabels?.y ?? copy.chart.axisFallbackY);

    // separate group for trajectory elements so Effect 2 can clear only them
    chart.append("g").attr("class", "trajectories-layer");
  }, [
    axisLabels?.x,
    axisLabels?.y,
    copy.chart.axisFallbackX,
    copy.chart.axisFallbackY,
  ]);

  // Effect 2: add animated elements per revealStep — never clears the whole SVG
  useEffect(() => {
    const chart = chartRef.current;
    const scales = scalesRef.current;
    const currentTrajectories = trajectoriesRef.current;
    if (
      !chart ||
      !scales ||
      currentTrajectories.length === 0 ||
      revealStep === 0
    )
      return;

    const { x: xScale, y: yScale, margin } = scales;

    // clear only trajectory elements from the previous step
    chart.select(".trajectories-layer").selectAll("*").remove();
    chart.selectAll(".step-label").remove();

    // reveal step 0 = nothing; elements fade/animate in as revealStep increases
    const STEP_LABELS: Record<number, string> = {
      1: "STATE",
      2: "ALTERNATIVES",
      3: "RISK",
      4: "DECISION",
    };
    const stepLabel = STEP_LABELS[revealStep];
    if (stepLabel) {
      chart
        .append("text")
        .attr("class", "step-label")
        .attr("x", margin.left + 8)
        .attr("y", margin.top + 16)
        .attr("fill", "rgba(103, 232, 249, 0.72)")
        .attr("font-size", 11)
        .attr("font-weight", 700)
        .attr("letter-spacing", "0.28em")
        .attr("opacity", 0)
        .text(stepLabel)
        .transition()
        .duration(220)
        .attr("opacity", 1);
    }

    // reveal step 0 = nothing; elements fade/animate in as revealStep increases
    const FADE_DURATION = 500;
    const LINE_DURATION = 700;

    const layer = chart.select<SVGGElement>(".trajectories-layer");

    currentTrajectories.forEach((trajectory, index) => {
      const isSelected =
        selectedAlternativeId === null
          ? index === 0
          : trajectory.id === selectedAlternativeId;
      // step 2+: dim non-selected trajectories so winner is dominant
      const groupOpacity = revealStep >= 2 && !isSelected ? 0.28 : 1;
      const group = layer
        .append("g")
        .attr("class", "cursor-pointer")
        .attr("opacity", groupOpacity)
        .on("click", () => onSelect(trajectory.id));

      // step 3+: uncertainty envelope
      if (revealStep >= 3) {
        group
          .append("circle")
          .attr("cx", xScale(trajectory.predicted.x))
          .attr("cy", yScale(trajectory.predicted.y))
          .attr("r", trajectory.uncertaintyRadius * 220)
          .attr("fill", trajectory.color)
          .attr("fill-opacity", 0)
          .attr("stroke", trajectory.color)
          .attr("stroke-opacity", 0)
          .attr("stroke-dasharray", "8 10")
          .transition()
          .duration(FADE_DURATION)
          .attr("fill-opacity", isSelected ? 0.16 : 0.08)
          .attr("stroke-opacity", isSelected ? 0.56 : 0.26);
      }

      // step 2+: trajectory line with dash-offset animation
      if (revealStep >= 2) {
        const lineEl = group
          .append("line")
          .attr("x1", xScale(trajectory.current.x))
          .attr("y1", yScale(trajectory.current.y))
          .attr("x2", xScale(trajectory.predicted.x))
          .attr("y2", yScale(trajectory.predicted.y))
          .attr("stroke", trajectory.color)
          .attr("stroke-width", isSelected ? 3.2 : 2.1)
          .attr("stroke-opacity", 0);

        const length = Math.hypot(
          xScale(trajectory.predicted.x) - xScale(trajectory.current.x),
          yScale(trajectory.predicted.y) - yScale(trajectory.current.y),
        );
        lineEl
          .attr("stroke-dasharray", length)
          .attr("stroke-dashoffset", length)
          .transition()
          .duration(LINE_DURATION)
          .attr("stroke-opacity", isSelected ? 0.92 : 0.62)
          .attr("stroke-dashoffset", 0);
      }

      // step 3+: future branch lines
      if (revealStep >= 3) {
        trajectory.futures.forEach((future) => {
          const fl = group
            .append("line")
            .attr("x1", xScale(trajectory.predicted.x))
            .attr("y1", yScale(trajectory.predicted.y))
            .attr("x2", xScale(future.x))
            .attr("y2", yScale(future.y))
            .attr("stroke", trajectory.color)
            .attr("stroke-width", 1.6)
            .attr("stroke-opacity", 0)
            .attr(
              "stroke-dasharray",
              future.kind === "optimistic" ? "4 6" : "8 7",
            );
          const fl_len = Math.hypot(
            xScale(future.x) - xScale(trajectory.predicted.x),
            yScale(future.y) - yScale(trajectory.predicted.y),
          );
          fl.attr("stroke-dashoffset", fl_len)
            .transition()
            .duration(LINE_DURATION)
            .attr("stroke-opacity", 0.7)
            .attr("stroke-dashoffset", 0);
        });
      }

      // step 1+: current state node
      if (revealStep >= 1) {
        group
          .append("circle")
          .attr("cx", xScale(trajectory.current.x))
          .attr("cy", yScale(trajectory.current.y))
          .attr("r", 0)
          .attr("fill", "#f8fafc")
          .attr("stroke", trajectory.color)
          .attr("stroke-width", isSelected ? 2.2 : 1.5)
          .transition()
          .duration(FADE_DURATION)
          .attr("r", isSelected ? 8.5 : 7);

        group
          .append("text")
          .attr("x", xScale(trajectory.current.x) + 12)
          .attr("y", yScale(trajectory.current.y) - 12)
          .attr("fill", "rgba(241, 245, 249, 0.88)")
          .attr("font-size", 11)
          .attr("opacity", 0)
          .text(trajectory.current.label)
          .transition()
          .delay(200)
          .duration(FADE_DURATION)
          .attr("opacity", 1);
      }

      // step 2+: predicted state node (brighter, larger) + label
      if (revealStep >= 2) {
        group
          .append("circle")
          .attr("cx", xScale(trajectory.predicted.x))
          .attr("cy", yScale(trajectory.predicted.y))
          .attr("r", 0)
          .attr("fill", trajectory.color)
          .attr("stroke", "rgba(248,250,252,0.9)")
          .attr("stroke-width", isSelected ? 2.5 : 1.8)
          .transition()
          .delay(LINE_DURATION * 0.7)
          .duration(FADE_DURATION)
          .attr("r", isSelected ? 10 : 8);

        group
          .append("text")
          .attr("x", xScale(trajectory.predicted.x) + 12)
          .attr("y", yScale(trajectory.predicted.y) - 14)
          .attr("fill", trajectory.color)
          .attr("font-size", 12)
          .attr("font-weight", 600)
          .attr("opacity", 0)
          .text(trajectory.label)
          .transition()
          .delay(LINE_DURATION)
          .duration(FADE_DURATION)
          .attr("opacity", 1);

        group
          .append("text")
          .attr("x", xScale(trajectory.predicted.x) + 12)
          .attr("y", yScale(trajectory.predicted.y) + 4)
          .attr("fill", "rgba(203, 213, 225, 0.76)")
          .attr("font-size", 11)
          .attr("opacity", 0)
          .text(trajectory.predicted.detail)
          .transition()
          .delay(LINE_DURATION)
          .duration(FADE_DURATION)
          .attr("opacity", 1);
      }

      // step 3+: future nodes
      if (revealStep >= 3) {
        trajectory.futures.forEach((future) => {
          group
            .append("circle")
            .attr("cx", xScale(future.x))
            .attr("cy", yScale(future.y))
            .attr("r", 0)
            .attr("fill", future.kind === "optimistic" ? "#4ade80" : "#f97316")
            .attr("stroke", "rgba(248,250,252,0.82)")
            .attr("stroke-width", 1.2)
            .transition()
            .delay(LINE_DURATION * 0.6)
            .duration(FADE_DURATION)
            .attr("r", 5.5);
        });
      }
    });
  }, [revealStep, selectedAlternativeId, onSelect]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_42%),linear-gradient(180deg,rgba(10,16,30,0.86),rgba(5,8,16,0.98))]">
      <svg
        ref={svgRef}
        className="h-[420px] w-full lg:h-[520px]"
        aria-label={copy.chart.ariaLabel}
      />

      {!hasRun ? (
        <div
          data-testid="chart-waiting"
          className="pointer-events-none absolute inset-x-6 bottom-6 rounded-3xl border border-cyan-300/15 bg-slate-950/68 px-5 py-4 backdrop-blur"
        >
          <p className="text-sm font-medium text-cyan-100">
            {copy.chart.waitingTitle}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {copy.chart.waitingDescription}
          </p>
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/44 backdrop-blur-sm">
          <div className="rounded-full border border-cyan-300/30 bg-slate-950/72 px-4 py-2 text-sm text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
            {copy.chart.loading}
          </div>
        </div>
      ) : null}

      <div className="border-t border-white/8 px-5 py-4">
        <div className="flex flex-wrap gap-3">
          {trajectories.map((trajectory) => {
            const active =
              selectedAlternativeId === null
                ? trajectory.id === trajectories[0]?.id
                : selectedAlternativeId === trajectory.id;

            return (
              <button
                key={trajectory.id}
                type="button"
                onClick={() => onSelect(trajectory.id)}
                className={cn(
                  "flex items-center gap-3 rounded-full border px-3 py-2 text-left text-xs transition",
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/16 hover:text-slate-200",
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: trajectory.color }}
                  aria-hidden="true"
                />
                <span className="uppercase tracking-[0.18em]">
                  {trajectory.label}
                </span>
                <span className="text-slate-500">
                  {trajectory.metrics.predictedState}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
