import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Menu,
  Breadcrumb,
  Card,
  Button,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  theme,
  Collapse,
  Input,
  Radio,
  Checkbox,
  DatePicker,
  Space,
  Typography,
  Divider,
} from "antd";
import dayjs from "dayjs";
import { DownOutlined } from "@ant-design/icons";
import { Line } from "@ant-design/plots";
import "./Dashboard.css";
import lamLogo from "../assets/Lam-Research-Logo.png";
import { buildHistogram } from "../utils/histogram";
import { buildNormalCurve, mergeData } from "../utils/normalCurve";
import { DistributionChart } from "../components/DistributionChart";
import { DistributionHistogram } from "../components/DistributionHistogram";
import { parseCSV, toNumber } from "../utils/csv";
import biasProbeCsv from "../../backend/temp_data/PM_GX_ADVCI_Bias2_Probe_2026.csv?raw";
import probeCsv from "../../backend/temp_data/PM_GX_ADVCI_Probe_2026.csv?raw";

const { Header, Content, Sider } = Layout;
const { Text } = Typography;
const { RangePicker } = DatePicker;

const items1 = ["Dashboard", "SPC", "Settings"].map((label, index) => ({
  key: String(index + 1),
  label,
}));

const geminiOptions = [
  { value: "BIAS_DEV", label: "BIAS_DEV", category: "Gemini" },
  { value: "BiasElectrode_ATAC", label: "BiasElectrode", category: "ATAC" },
  { value: "BiasElectrode_Gemini", label: "BiasElectrode", category: "Gemini" },
  {
    value: "BiasElectrode_NXP",
    label: "BiasElectrode_NXP",
    category: "Gemini",
  },
  {
    value: "BiasElectrodeSyndionGSeries",
    label: "BiasElectrodeSyndionGSeries",
    category: "ATAC",
  },
  { value: "BiasMatch", label: "BiasMatch", category: "ATAC" },
];

const vciProbeOptions = [
  { label: "VCIProbeTest_BIAS", value: "VCIProbeTest_BIAS" },
  { label: "VCIProbeTest_RF", value: "VCIProbeTest_RF" },
  { label: "VCIProbeTest_TEMP", value: "VCIProbeTest_TEMP" },
];

const overallResultOptions = [
  { label: "All", value: "ALL" },
  { label: "PASS", value: "PASSED" },
  { label: "FAIL", value: "FAILED" },
];

const preferredMetrics = ["CAPACITANCE", "FWD_1", "FWD_10"];

function parseStartTime(rawTime) {
  const parsed = dayjs(rawTime);
  return parsed.isValid() ? parsed : null;
}

function formatTimestamp(rawTime, index) {
  if (!rawTime) {
    return `Sample ${index + 1}`;
  }

  const parsed = parseStartTime(rawTime);
  if (parsed) {
    return parsed.format("YYYY-MM-DD HH:mm");
  }

  return `Sample ${index + 1}`;
}

function formatXAxisLabel(value) {
  return value % 25 === 1 ? `#${value}` : "";
}

function getMetricList(rows) {
  const allKeys = new Set();

  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (toNumber(value) !== null) {
        allKeys.add(key);
      }
    });
  });

  const preferred = preferredMetrics.filter((metric) => allKeys.has(metric));
  const extraMetrics = [...allKeys].filter(
    (metric) => !preferred.includes(metric),
  );

  return [...preferred, ...extraMetrics];
}

function normalizeDataset(key, label, csvText) {
  const rows = parseCSV(csvText);
  const metrics = getMetricList(rows);

  const records = rows
    .map((row, index) => {
      const numericValues = metrics.reduce((accumulator, metric) => {
        const parsedValue = toNumber(row[metric]);
        if (parsedValue !== null) {
          accumulator[metric] = parsedValue;
        }
        return accumulator;
      }, {});

      return {
        key: `${key}-${index}`,
        time: formatTimestamp(row.START_TIME, index),
        rawTime: row.START_TIME || "",
        startTimeValue: parseStartTime(row.START_TIME)?.valueOf() ?? null,
        result: row.OVER_ALL_RESULT || "UNKNOWN",
        version: row.VERSION || "",
        serialNumber: row.SERIAL_NUMBER || "",
        ...numericValues,
      };
    })
    .filter((record) =>
      metrics.some((metric) => Number.isFinite(record[metric])),
    );

  return {
    key,
    label,
    metrics,
    records,
  };
}

function calculateMetricStats(records, metric) {
  const values = records
    .map((record) => record[metric])
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  const count = values.length;
  const mean = values.reduce((sum, value) => sum + value, 0) / count;
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  const lcl = mean - 3 * stdDev;
  const ucl = mean + 3 * stdDev;
  const oocPoints = values.filter((value) => value < lcl || value > ucl).length;

  return {
    count,
    mean,
    stdDev,
    lcl,
    ucl,
    oocPoints,
    oocPercent: count === 0 ? 0 : (oocPoints / count) * 100,
  };
}

const csvDatasets = [
  normalizeDataset(
    "bias2Probe",
    "PM_GX_ADVCI_Bias2_Probe_2026.csv",
    biasProbeCsv,
  ),
  normalizeDataset("probe", "PM_GX_ADVCI_Probe_2026.csv", probeCsv),
];

function FilterSidebar({
  geminiSearch,
  setGeminiSearch,
  selectedGemini,
  setSelectedGemini,
  selectedProbe,
  setSelectedProbe,
  versionOptions,
  selectedVersions,
  setSelectedVersions,
  dateRange,
  setDateRange,
  colorBgContainer,
}) {
  const filteredGeminiOptions = useMemo(() => {
    const keyword = geminiSearch.trim().toLowerCase();
    if (!keyword) return geminiOptions;
    return geminiOptions.filter(
      (item) =>
        item.label.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword),
    );
  }, [geminiSearch]);

  return (
    <Sider
      width={320}
      breakpoint="lg"
      collapsedWidth={0}
      style={{
        background: "#f6f8fb",
        padding: 16,
        overflow: "auto",
        borderRight: "1px solid #f0f0f0",
      }}
    >
      <Card
        styles={{ body: { padding: 0 } }}
        style={{
          borderRadius: 24,
          overflow: "hidden",
          background: colorBgContainer,
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        }}
      >
        <Collapse
          defaultActiveKey={["gemini"]}
          bordered={false}
          expandIcon={({ isActive }) => (
            <DownOutlined rotate={isActive ? 180 : 0} />
          )}
          items={[
            {
              key: "gemini",
              label: (
                <div style={{ fontWeight: 600 }}>
                  Gemini:{" "}
                  <span style={{ fontWeight: 500 }}>
                    {
                      geminiOptions.find((x) => x.value === selectedGemini)
                        ?.label
                    }
                  </span>
                </div>
              ),
              children: (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Input
                    placeholder="bias"
                    value={geminiSearch}
                    onChange={(e) => setGeminiSearch(e.target.value)}
                    style={{ borderRadius: 20 }}
                  />

                  <div
                    style={{
                      maxHeight: 280,
                      overflowY: "auto",
                      paddingRight: 4,
                    }}
                  >
                    <Radio.Group
                      value={selectedGemini}
                      onChange={(e) => setSelectedGemini(e.target.value)}
                      style={{ width: "100%" }}
                    >
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {filteredGeminiOptions.map((item) => (
                          <div
                            key={item.value}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                              padding: "4px 0",
                            }}
                          >
                            <Radio value={item.value} />
                            <div style={{ lineHeight: 1.2 }}>
                              <div style={{ fontWeight: 500 }}>
                                {item.label}
                              </div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.category}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </Space>
                    </Radio.Group>
                  </div>
                </Space>
              ),
            },
            {
              key: "probe",
              label: <div style={{ fontWeight: 600 }}>{selectedProbe}</div>,
              children: (
                <Select
                  value={selectedProbe}
                  onChange={setSelectedProbe}
                  style={{ width: "100%" }}
                  options={vciProbeOptions}
                />
              ),
            },
            {
              key: "version",
              label: <div style={{ fontWeight: 600 }}>Version</div>,
              children: (
                <Checkbox.Group
                  value={selectedVersions}
                  onChange={setSelectedVersions}
                  style={{ width: "100%" }}
                >
                  <Space direction="vertical">
                    {versionOptions.map((version) => (
                      <Checkbox key={version} value={version}>
                        {version}
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              ),
            },
            {
              key: "moreFilters",
              label: <div style={{ fontWeight: 600 }}>More Filters</div>,
              children: (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Date Range
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <RangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      style={{ width: "100%" }}
                      format="YYYY-MM-DD HH:mm"
                      showTime={{ format: "HH:mm" }}
                    />
                  </div>
                </div>
              ),
            },
          ]}
        />
        <Divider style={{ margin: 0 }} />
        <div style={{ padding: 16 }}>
          <Text strong>Selected Filters</Text>
          <div style={{ marginTop: 10, lineHeight: 1.8 }}>
            <div>
              <Text type="secondary">Gemini:</Text>{" "}
              {geminiOptions.find((x) => x.value === selectedGemini)?.label}
            </div>
            <div>
              <Text type="secondary">Category:</Text>{" "}
              {geminiOptions.find((x) => x.value === selectedGemini)?.category}
            </div>
            <div>
              <Text type="secondary">Probe:</Text> {selectedProbe}
            </div>
            <div>
              <Text type="secondary">Version:</Text>{" "}
              {selectedVersions.length > 0
                ? selectedVersions.join(", ")
                : "All"}
            </div>
            <div>
              <Text type="secondary">From:</Text>{" "}
              {dateRange?.[0]?.format("YYYY-MM-DD HH:mm")}
            </div>
            <div>
              <Text type="secondary">To:</Text>{" "}
              {dateRange?.[1]?.format("YYYY-MM-DD HH:mm")}
            </div>
          </div>
        </div>
      </Card>
    </Sider>
  );
}

const Dashboard = () => {
  const [selectedDatasetKey, setSelectedDatasetKey] = useState(
    "probe",
  );
  const [selectedMetric, setSelectedMetric] = useState("CAPACITANCE");
  const [selectedOverallResult, setSelectedOverallResult] = useState("ALL");
  const [geminiSearch, setGeminiSearch] = useState("bias");
  const [selectedGemini, setSelectedGemini] = useState("BiasElectrode_Gemini");
  const [selectedProbe, setSelectedProbe] = useState("VCIProbeTest_BIAS");
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [dateRange, setDateRange] = useState(null);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const selectedDataset =
    csvDatasets.find((dataset) => dataset.key === selectedDatasetKey) ??
    csvDatasets[0];

  useEffect(() => {
    if (selectedDataset && !selectedDataset.metrics.includes(selectedMetric)) {
      setSelectedMetric(selectedDataset.metrics[0] ?? "");
    }
  }, [selectedDataset, selectedMetric]);

  const metricOptions = useMemo(
    () =>
      (selectedDataset?.metrics ?? []).map((metric) => ({
        label: metric,
        value: metric,
      })),
    [selectedDataset],
  );

  const versionOptions = useMemo(() => {
    const versions = new Set(
      (selectedDataset?.records ?? [])
        .map((record) => record.version)
        .filter(Boolean),
    );

    return [...versions].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }, [selectedDataset]);

  const activeMetric = metricOptions.some(
    (option) => option.value === selectedMetric,
  )
    ? selectedMetric
    : metricOptions[0]?.value;

  const datasetStartTimeRange = useMemo(() => {
    const values = (selectedDataset?.records ?? [])
      .map((record) => record.startTimeValue)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    if (values.length === 0) {
      return null;
    }

    return [dayjs(values[0]), dayjs(values[values.length - 1])];
  }, [selectedDataset]);

  useEffect(() => {
    setDateRange(datasetStartTimeRange);
  }, [datasetStartTimeRange, selectedDatasetKey]);

  const filteredRecords = useMemo(() => {
    if (!selectedDataset) {
      return [];
    }

    return selectedDataset.records.filter((record) => {
      const versionMatches =
        selectedVersions.length === 0 ||
        selectedVersions.includes(record.version);
      const resultMatches =
        selectedOverallResult === "ALL" ||
        record.result === selectedOverallResult;

      const hasValidDate = Number.isFinite(record.startTimeValue);
      const withinDateRange =
        !hasValidDate ||
        !dateRange?.[0] ||
        !dateRange?.[1] ||
        (record.startTimeValue >= dateRange[0].valueOf() &&
          record.startTimeValue <= dateRange[1].valueOf());

      return versionMatches && resultMatches && withinDateRange;
    });
  }, [dateRange, selectedDataset, selectedOverallResult, selectedVersions]);

  const lastValidTimestamp = useMemo(() => {
    const latestStartTime = filteredRecords.reduce((latestValue, record) => {
      if (!Number.isFinite(record.startTimeValue)) {
        return latestValue;
      }

      return Math.max(latestValue, record.startTimeValue);
    }, Number.NEGATIVE_INFINITY);

    if (Number.isFinite(latestStartTime)) {
      return dayjs(latestStartTime).format("YYYY-MM-DD HH:mm");
    }

    return "No valid timestamp";
  }, [filteredRecords]);

  const summaryTableData = useMemo(
    () =>
      (selectedDataset?.metrics ?? [])
        .map((metric, index) => {
          const stats = calculateMetricStats(filteredRecords, metric);
          if (!stats) {
            return null;
          }

          return {
            key: `${metric}-${index}`,
            propertyName: metric,
            count: stats.count,
            stdDev: stats.stdDev,
            lcl: stats.lcl,
            mean: stats.mean,
            ucl: stats.ucl,
            oocPoints: stats.oocPoints,
            oocPercent: stats.oocPercent,
          };
        })
        .filter(Boolean),
    [filteredRecords, selectedDataset],
  );

  const selectedMetricStats = useMemo(
    () => summaryTableData.find((row) => row.propertyName === activeMetric),
    [activeMetric, summaryTableData],
  );

  const chartData = useMemo(() => {
    if (!activeMetric || !selectedMetricStats) {
      return [];
    }

    return filteredRecords
      .filter((record) => Number.isFinite(record[activeMetric]))
      .map((record, index) => ({
        ...record,
        sample: index + 1,
        metricValue: record[activeMetric],
        UCL: selectedMetricStats.ucl,
        LCL: selectedMetricStats.lcl,
        status:
          record[activeMetric] > selectedMetricStats.ucl ||
          record[activeMetric] < selectedMetricStats.lcl
            ? "alarm"
            : "normal",
      }));
  }, [activeMetric, filteredRecords, selectedMetricStats]);

  const latest = chartData[chartData.length - 1];
  const rawValues = chartData.map((record) => record.metricValue);

  const distributionData = useMemo(() => {
    if (rawValues.length === 0) {
      return [];
    }

    const mean =
      rawValues.reduce((sum, value) => sum + value, 0) / rawValues.length;
    const std = Math.sqrt(
      rawValues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
        rawValues.length,
    );

    if (std === 0) {
      return [];
    }

    const binCount = 20;
    const bins = buildHistogram(rawValues, binCount);
    const binWidth =
      (Math.max(...rawValues) - Math.min(...rawValues)) / binCount;
    const curve = buildNormalCurve(
      mean,
      std,
      rawValues.length,
      binWidth,
      Math.min(...rawValues),
      Math.max(...rawValues),
    );

    return mergeData(bins, curve);
  }, [rawValues]);

  const histogramBins = useMemo(() => {
    if (rawValues.length === 0) {
      return [];
    }

    const binCount = Math.min(
      20,
      Math.max(8, Math.ceil(Math.sqrt(rawValues.length))),
    );
    return buildHistogram(rawValues, binCount);
  }, [rawValues]);

  const controlChartWidth = Math.max(1100, chartData.length * 14);

  const trendConfig = {
    data: chartData.map((record) => ({
      sample: record.sample,
      value: record.metricValue,
      time: record.time,
    })),
    xField: "sample",
    yField: "value",
    smooth: true,
    height: 300,
    autoFit: true,
    axis: {
      x: {
        title: "Sample",
        label: {
          autoHide: false,
          autoRotate: false,
          formatter: formatXAxisLabel,
        },
      },
    },
    tooltip: {
      items: [
        (datum) => ({
          name: "Value",
          value: datum.value,
        }),
        (datum) => ({
          name: "Time",
          value: datum.time,
        }),
      ],
    },
    annotations: latest
      ? [
          {
            type: "lineY",
            yField: latest.UCL,
            style: { stroke: "red", lineDash: [4, 4], lineWidth: 1 },
          },
          {
            type: "lineY",
            yField: latest.LCL,
            style: { stroke: "red", lineDash: [4, 4], lineWidth: 1 },
          },
          {
            type: "lineY",
            yField: selectedMetricStats?.mean,
            style: { stroke: "green", lineDash: [2, 2], lineWidth: 1 },
          },
        ]
      : [],
  };

  const controlConfig = {
    data: chartData.map((record) => ({
      sample: record.sample,
      serialNumber: record.serialNumber,
      value: record.metricValue,
      time: record.time,
      status: record.status,
    })),
    xField: "sample",
    yField: "value",
    height: 400,
    width: controlChartWidth,
    autoFit: false,
    axis: {
      x: {
        title: "Sample",
        label: {
          autoHide: false,
          autoRotate: false,
          formatter: formatXAxisLabel,
        },
      },
    },
    colorField: "status",
    color: ({ status }) => (status === "alarm" ? "#ff4d4f" : "#1677ff"),
    point: {
      size: 4,
      shape: "circle",
      style: (datum) => {
        if (datum.status === "alarm") {
          return { fill: "red" };
        }
        return {};
      },
    },
    tooltip: {
      items: [
        (datum) => ({
          name: "Serial Number",
          value: datum.serialNumber,
        }),
        (datum) => ({
          name: activeMetric,
          value: datum.value,
        }),
        (datum) => ({
          name: "Time",
          value: datum.time,
        }),
        () => ({
          name: "UCL",
          value: Number(selectedMetricStats?.ucl ?? 0).toFixed(2),
        }),
        () => ({
          name: "LCL",
          value: Number(selectedMetricStats?.lcl ?? 0).toFixed(2),
        }),
      ],
    },
    annotations: latest
      ? [
          {
            type: "lineY",
            yField: latest.UCL,
            style: { stroke: "#ff4d4f", lineDash: [4, 4], lineWidth: 1.5 },
            text: {
              content: "UCL",
              position: "left",
              style: { fill: "#ff4d4f" },
            },
          },
          {
            type: "lineY",
            yField: latest.LCL,
            style: { stroke: "#ff4d4f", lineDash: [4, 4], lineWidth: 1.5 },
            text: {
              content: "LCL",
              position: "left",
              style: { fill: "#ff4d4f" },
            },
          },
          {
            type: "lineY",
            yField: selectedMetricStats?.mean,
            style: { stroke: "#52c41a", lineDash: [2, 2], lineWidth: 1.5 },
            text: {
              content: "CL",
              position: "left",
              style: { fill: "#52c41a" },
            },
          },
        ]
      : [],
  };

  const summaryColumns = [
    { title: "Property Name", dataIndex: "propertyName" },
    { title: "Count", dataIndex: "count" },
    {
      title: "Standard Deviation",
      dataIndex: "stdDev",
      render: (value) => Number(value).toFixed(2),
    },
    {
      title: "LCL (-3 sigma)",
      dataIndex: "lcl",
      render: (value) => Number(value).toFixed(2),
    },
    {
      title: "CL (Mean)",
      dataIndex: "mean",
      render: (value) => Number(value).toFixed(2),
    },
    {
      title: "UCL (+3 sigma)",
      dataIndex: "ucl",
      render: (value) => Number(value).toFixed(2),
    },
    { title: "OOC Points", dataIndex: "oocPoints" },
    {
      title: "OOC %",
      dataIndex: "oocPercent",
      render: (value) => Number(value).toFixed(2),
    },
  ];

  const alarmLogData = useMemo(
    () =>
      chartData.map((record) => ({
        key: record.key,
        sample: record.sample,
        time: record.time,
        serialNumber: record.serialNumber || "-",
        version: record.version || "-",
        result: record.result || "UNKNOWN",
        metricValue: Number(record.metricValue.toFixed(2)),
        lcl: Number(record.LCL.toFixed(2)),
        mean: Number((selectedMetricStats?.mean ?? 0).toFixed(2)),
        ucl: Number(record.UCL.toFixed(2)),
        spcStatus: record.status === "alarm" ? "Out of Control" : "In Control",
      })),
    [chartData, selectedMetricStats],
  );

  const outOfControlAlarmLogData = useMemo(
    () => alarmLogData.filter((record) => record.spcStatus === "Out of Control"),
    [alarmLogData],
  );

  const alarmLogColumns = [
    { title: "Sample", dataIndex: "sample", width: 80, fixed: "left" },
    { title: "Time", dataIndex: "time", width: 170 },
    { title: "Serial Number", dataIndex: "serialNumber", width: 160 },
    { title: "Version", dataIndex: "version", width: 90 },
    { title: "CSV Result", dataIndex: "result", width: 110 },
    {
      title: activeMetric,
      dataIndex: "metricValue",
      width: 120,
    },
    { title: "LCL", dataIndex: "lcl", width: 100 },
    { title: "CL", dataIndex: "mean", width: 100 },
    { title: "UCL", dataIndex: "ucl", width: 100 },
    { title: "SPC Status", dataIndex: "spcStatus", width: 130 },
  ];

  const outOfControlCount = selectedMetricStats?.oocPoints ?? 0;
  const lastAlarmTimestamp = useMemo(() => {
    const latestAlarmTime = chartData.reduce((latestValue, record) => {
      if (
        record.status !== "alarm" ||
        !Number.isFinite(record.startTimeValue)
      ) {
        return latestValue;
      }

      return Math.max(latestValue, record.startTimeValue);
    }, Number.NEGATIVE_INFINITY);

    if (Number.isFinite(latestAlarmTime)) {
      return dayjs(latestAlarmTime).format("YYYY-MM-DD HH:mm");
    }

    return "No valid alarm timestamp";
  }, [chartData]);
  const selectedGeminiRecord = geminiOptions.find(
    (item) => item.value === selectedGemini,
  );

  const exportRows = useMemo(
    () =>
      chartData.map((record) => ({
        Sample: record.sample,
        Time: record.time,
        Serial_Number: record.serialNumber || "",
        Version: record.version || "",
        Overall_Result: record.result || "",
        Metric: activeMetric,
        Metric_Value: Number(record.metricValue.toFixed(2)),
        Mean: Number((selectedMetricStats?.mean ?? 0).toFixed(2)),
        LCL: Number(record.LCL.toFixed(2)),
        UCL: Number(record.UCL.toFixed(2)),
        SPC_Status: record.status === "alarm" ? "Out of Control" : "In Control",
      })),
    [activeMetric, chartData, selectedMetricStats],
  );

  function escapeCsvCell(value) {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function handleExportExcel() {
    if (exportRows.length === 0) {
      return;
    }

    const headers = Object.keys(exportRows[0]);
    const csvLines = [
      headers.join(","),
      ...exportRows.map((row) =>
        headers.map((header) => escapeCsvCell(row[header])).join(","),
      ),
    ];

    const csvContent = `\uFEFF${csvLines.join("\r\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileStamp = dayjs().format("YYYYMMDD_HHmm");

    link.href = url;
    link.download = `${selectedDataset?.key || "dashboard"}_${activeMetric}_${selectedOverallResult}_${fileStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Header style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <img
          src={lamLogo}
          alt="LAM Research"
          style={{ height: 32, marginRight: 20 }}
        />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["2"]}
          items={items1}
          style={{ flex: 1 }}
        />
      </Header>

      <Layout style={{ flex: 1, overflow: "hidden" }}>
        <FilterSidebar
          geminiSearch={geminiSearch}
          setGeminiSearch={setGeminiSearch}
          selectedGemini={selectedGemini}
          setSelectedGemini={setSelectedGemini}
          selectedProbe={selectedProbe}
          setSelectedProbe={setSelectedProbe}
          versionOptions={versionOptions}
          selectedVersions={selectedVersions}
          setSelectedVersions={setSelectedVersions}
          dateRange={dateRange}
          setDateRange={setDateRange}
          colorBgContainer={colorBgContainer}
        />

        <Layout
          style={{
            padding: "0 16px 16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Breadcrumb
            items={[
              { title: "Home" },
              { title: selectedGeminiRecord?.category || "Gemini" },
              { title: selectedGeminiRecord?.label || "BiasElectrode" },
            ]}
            style={{ margin: "16px 0" }}
          />

          <Content
            style={{
              padding: 20,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              overflow: "auto",
              flex: 1,
            }}
          >
            <Row gutter={[12, 12]} wrap={false}>
              <Col flex="auto">
                <Card size="small">
                  <Statistic
                    title="Gemini"
                    value={selectedGeminiRecord?.label}
                  />
                </Card>
              </Col>
              <Col flex="auto">
                <Card size="small">
                  <Statistic title="Probe" value={selectedProbe} />
                </Card>
              </Col>
              <Col flex="auto">
                <Card size="small">
                  <Statistic
                    title="Last Update"
                    value={lastValidTimestamp}
                  />
                </Card>
              </Col>
              <Col flex="auto">
                <Card size="small">
                  <Statistic
                    title="Out of Control"
                    value={outOfControlCount}
                    valueStyle={{ color: "red" }}
                  />
                </Card>
              </Col>
              <Col flex="auto">
                <Card size="small">
                  <Statistic
                    title="Mean"
                    value={selectedMetricStats?.mean ?? 0}
                    precision={2}
                  />
                </Card>
              </Col>
              <Col flex="auto">
                <Card size="small">
                  <Statistic
                    title="Last Alarm"
                    value={lastAlarmTimestamp}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={12} style={{ marginTop: 20 }}>
              <Col>
                <Select
                  value={selectedDataset?.key}
                  onChange={setSelectedDatasetKey}
                  style={{ width: 320 }}
                  options={csvDatasets.map((dataset) => ({
                    label: dataset.label,
                    value: dataset.key,
                  }))}
                />
              </Col>
              <Col>
                <Select
                  value={activeMetric}
                  onChange={(value) => setSelectedMetric(value)}
                  style={{ width: 220 }}
                  options={metricOptions}
                />
              </Col>
              <Col>
                <Select
                  value={selectedOverallResult}
                  onChange={setSelectedOverallResult}
                  style={{ width: 220 }}
                  options={overallResultOptions}
                  placeholder="Overall Result"
                />
              </Col>
              <Col flex="auto">
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    onClick={handleExportExcel}
                    disabled={exportRows.length === 0}
                    aria-label="Export current dashboard data"
                    title="Export current dashboard data"
                    className="export-excel-button"
                    style={{
                      width: 44,
                      height: 44,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      background: "#ffffff",
                      borderColor: "#d9d9d9",
                    }}
                  >
                    <img
                      src="/excel-icon.png"
                      alt="Export"
                      style={{ width: 22, height: 22, display: "block" }}
                    />
                  </Button>
                </div>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 20 }}>
              <Col span={18}>
                <Card title="SPC Control Chart">
                  <div style={{ overflowX: "auto", overflowY: "hidden" }}>
                    <div style={{ width: controlChartWidth }}>
                      <Line {...controlConfig} />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card title="Distribution Histogram">
                  {histogramBins.length > 0 ? (
                    <DistributionHistogram
                      data={histogramBins}
                      metric={activeMetric}
                      limits={selectedMetricStats}
                    />
                  ) : (
                    <p>No data</p>
                  )}
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
              <Col xs={24} lg={14}>
                <Card title="Trend Chart" style={{ overflow: "hidden" }}>
                  <Line {...trendConfig} />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card title="Distribution Chart">
                  {distributionData.length > 0 ? (
                    <DistributionChart data={distributionData} />
                  ) : (
                    <p>No variance in data</p>
                  )}
                </Card>
              </Col>
            </Row>

            <Row style={{ marginTop: 20 }}>
              <Col span={24}>
                <Card title="Alarm Log">
                  {outOfControlAlarmLogData.length > 0 ? (
                    <Table
                      columns={alarmLogColumns}
                      dataSource={outOfControlAlarmLogData}
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 1200 }}
                    />
                  ) : (
                    <p>No out-of-control data for the current selection.</p>
                  )}
                </Card>
              </Col>
            </Row>

            <Row style={{ marginTop: 20 }}>
              <Col span={24}>
                <Card title="Metric Summary">
                  <Table
                    columns={summaryColumns}
                    dataSource={summaryTableData}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: "max-content" }}
                  />
                </Card>
              </Col>
            </Row>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
