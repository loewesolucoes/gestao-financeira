'use client';

import { useEffect, useState, useRef } from "react";
import type { ApexOptions } from "apexcharts";
import { EnumUtil } from "../utils/enum";
import { NumberUtil } from "../utils/number";

export enum ChartPalette {
  yellow = "rgba(255, 193, 7, 1)",
  blue = "rgba(0, 123, 255, 1)",
  purple = "rgba(111, 66, 193, 1)",
  gray = "rgba(108, 117, 125, 1)",
  orange = "rgba(253, 126, 20, 1)",
  teal = "rgba(32, 201, 151, 1)",
  green = "rgba(67, 160, 71, 1)",
  red = "rgba(229, 57, 53, 1)",
}

export const defaultChartOptions: ApexOptions = {
  chart: {
    zoom: { enabled: true, autoScaleYaxis: true },
    toolbar: { show: true },
    foreColor: '#999',
  },
  colors: EnumUtil.values(ChartPalette).map(x => ChartPalette[x]),
  stroke: { curve: 'smooth', },
  fill: {
    type: 'gradient',
    gradient: {
      opacityFrom: 1,
      opacityTo: 0.8,
    }
  },
  grid: {
    show: true,
    borderColor: 'rgba(56, 56, 56, 0.06)',
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: true } },
  },
  dataLabels: { enabled: false },
  legend: { position: "bottom" as const },
  responsive: [{ breakpoint: 600, options: { chart: { width: "100%" } } }],
  yaxis: { labels: { formatter: NumberUtil.toCurrencyAbbreviated, } },
}

interface Props {
  type?:
  | "line"
  | "area"
  | "bar"
  | "pie"
  | "donut"
  | "radialBar"
  | "scatter"
  | "bubble"
  | "heatmap"
  | "candlestick"
  | "boxPlot"
  | "radar"
  | "polarArea"
  | "rangeBar"
  | "rangeArea"
  | "treemap";
  series?: ApexOptions["series"];
  width?: string | number;
  height?: string | number;
  options?: ApexOptions;
  [key: string]: any;
}

declare global {
  interface Window {
    __ApexCharts?: any;
  }
}

export function ChartWrapper({ type, series, options, width, height }: Props) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setIsLoading(true);

    if (window.__ApexCharts == null) {
      window.__ApexCharts = (await import("apexcharts")).default as any;
    }

    setIsLoading(false);
  }

  return (
    isLoading ? (
      <div className="loading-chart" style={{ width: width, height: height }}>
        <span>Loading...</span>
      </div>
    ) : (
      <ReactApexcharts
        type={type}
        series={series}
        options={options}
        width={width as any}
        height={height as any}
        {...{} as any}
      />
    )
  );
}

function omit(obj, keysToRemove) {
  let newObj = { ...obj };

  keysToRemove.forEach((key) => {
    delete newObj[key];
  });

  return newObj;
}

function deepEqual(obj1, obj2, visited = new WeakSet()) {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  ) {
    return false;
  }

  if (visited.has(obj1) || visited.has(obj2)) return true; // Handle circular refs
  visited.add(obj1);
  visited.add(obj2);

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key], visited)) {
      return false;
    }
  }

  return true;
}

export function ReactApexcharts(props) {
  const { type = "line", width = "100%", height = "auto", series, options, ...restProps } = props;

  const chartElementRef = useRef<HTMLDivElement | null>(null);
  let chart = useRef<any>(null);
  const prevOptions = useRef<ApexOptions | null>(null);

  useEffect(() => {
    loadAndRender();

    return () => {
      if (chart.current && typeof chart.current.destroy === "function") {
        chart.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    updateOptionsOrSeries();
  }, [options, series, height, width]);

  async function loadAndRender() {
    prevOptions.current = options;

    const current = chartElementRef.current;
    const chartConfig = getConfig(true);

    chart.current = new window.__ApexCharts(current, chartConfig);
    chart.current.render();
  }

  function updateOptionsOrSeries() {
    const prevSeries = chart.current.w.config.series;

    const seriesChanged = !deepEqual(prevSeries, series);
    const optionsChanged = !deepEqual(prevOptions.current, options) ||
      height !== chart.current.opts.chart.height ||
      width !== chart.current.opts.chart.width;

    if (seriesChanged || optionsChanged) {
      if (!seriesChanged) {
        // series has not changed, but options or size have changed
        chart.current.updateOptions(getConfig());
      } else if (!optionsChanged) {
        // options or size have not changed, just the series has changed
        chart.current.updateSeries(series);
      } else {
        // both might be changed
        chart.current.updateSeries(series);
        chart.current.updateOptions(getConfig());
      }
    }

    prevOptions.current = options;
  }

  function getConfig(withoutId: boolean = false): ApexOptions {
    const newOptions = {
      chart: { type, height, width },
      series
    };

    const nextOptions = extend(options, newOptions);

    if (withoutId) {
      // Remove the id if we don't want it
      delete nextOptions.chart.id;
    }

    return nextOptions;
  }

  const rest = omit(restProps, Object.keys(['type', 'series', 'options', 'width', 'height']));

  return <div ref={chartElementRef} {...rest} />;

}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

function extend(target, source) {
  let output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = extend(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}