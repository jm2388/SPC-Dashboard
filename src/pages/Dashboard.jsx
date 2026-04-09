import React, { useMemo, useState } from "react";
import {
  Layout,
  Menu,
  Breadcrumb,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
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
import { Line, Histogram } from "@ant-design/plots";
import lamLogo from "../assets/Lam-Research-Logo.png";
import { buildHistogram } from "../utils/histogram";
import { buildNormalCurve, mergeData } from "../utils/normalCurve";
import { DistributionChart } from "../components/DistributionChart";

const { Header, Content, Sider } = Layout;
const { Text } = Typography;
const { RangePicker } = DatePicker;

// ---------------- TOP MENU ----------------
const items1 = ["Dashboard", "SPC", "Settings"].map((label, index) => ({
  key: String(index + 1),
  label,
}));

// ---------------- FILTER DATA ----------------
const geminiOptions = [
  { value: "BIAS_DEV", label: "BIAS_DEV", category: "Gemini" },
  { value: "BiasElectrode_ATAC", label: "BiasElectrode", category: "ATAC" },
  { value: "BiasElectrode_Gemini", label: "BiasElectrode", category: "Gemini" },
  { value: "BiasElectrode_NXP", label: "BiasElectrode_NXP", category: "Gemini" },
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

const versionOptions = ["1.1", "1.2", "1.3"];

// ---------------- PROPERTY OPTIONS ----------------
const propertyOptions = [
  { label: "CAPACITANCE", value: "CAPACITANCE" },
  { label: "FWD_1", value: "FWD_1" },
  { label: "FWD_10", value: "FWD_10" },
];

// ---------------- MOCK DATA ----------------
const generateData = () => {
  const data = [];
  for (let i = 0; i < 50; i++) {
    data.push({
      time: `T${i}`,
      CAPACITANCE: 319.85 + Math.random() * 20 - 10,
      FWD_1: 5.0,
      FWD_10: 50.0,
      UCL: 348.33,
      LCL: 291.36,
    });
  }
  return data;
};

const data = generateData();
const latest = data[data.length - 1];

// ---------------- TREND DATA (longer time range) ----------------
const generateTrendData = () => {
  const trendData = [];
  for (let i = 0; i < 200; i++) {
    trendData.push({
      time: `W${i + 1}`,
      CAPACITANCE: 319.85 + Math.random() * 30 - 15,
      FWD_1: 5.0 + (Math.random() > 0.95 ? Math.random() * 0.5 : 0),
      FWD_10: 50.0 + (Math.random() > 0.95 ? Math.random() * 2 : 0),
    });
  }
  return trendData;
};
const trendData = generateTrendData();

// ---------------- CUSTOM FILTER SIDER ----------------
function FilterSidebar({
  geminiSearch,
  setGeminiSearch,
  selectedGemini,
  setSelectedGemini,
  selectedProbe,
  setSelectedProbe,
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
        item.category.toLowerCase().includes(keyword)
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
                    {geminiOptions.find((x) => x.value === selectedGemini)?.label}
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
                              <div style={{ fontWeight: 500 }}>{item.label}</div>
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
                      format="MMM DD, YYYY"
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
              {selectedVersions.join(", ")}
            </div>
            <div>
              <Text type="secondary">From:</Text>{" "}
              {dateRange?.[0]?.format("MMM DD, YYYY")}
            </div>
            <div>
              <Text type="secondary">To:</Text>{" "}
              {dateRange?.[1]?.format("MMM DD, YYYY")}
            </div>
          </div>
        </div>
      </Card>
    </Sider>
  );
}

// ---------------- DASHBOARD ----------------
const Dashboard = () => {
  const [selectedMetric, setSelectedMetric] = useState("CAPACITANCE");

  const [geminiSearch, setGeminiSearch] = useState("bias");
  const [selectedGemini, setSelectedGemini] = useState("BiasElectrode_Gemini");
  const [selectedProbe, setSelectedProbe] = useState("VCIProbeTest_BIAS");
  const [selectedVersions, setSelectedVersions] = useState(["1.1", "1.2", "1.3"]);
  const [dateRange, setDateRange] = useState([
    dayjs("2024-01-01"),
    dayjs("2026-03-24"),
  ]);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const rawValues = useMemo(
    () => data.map((d) => d[selectedMetric]),
    [selectedMetric]
  );

  const distributionData = useMemo(() => {
    const mean = rawValues.reduce((a, b) => a + b, 0) / rawValues.length;
    const std = Math.sqrt(
      rawValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
        rawValues.length
    );
    if (std === 0) return [];
    const BIN_COUNT = 20;
    const bins = buildHistogram(rawValues, BIN_COUNT);
    const binWidth =
      (Math.max(...rawValues) - Math.min(...rawValues)) / BIN_COUNT;
    const curve = buildNormalCurve(
      mean,
      std,
      rawValues.length,
      binWidth,
      Math.min(...rawValues),
      Math.max(...rawValues)
    );
    return mergeData(bins, curve);
  }, [rawValues]);

  const trendConfig = {
    data: trendData.map((d) => ({
      time: d.time,
      value: d[selectedMetric],
    })),
    xField: "time",
    yField: "value",
    smooth: true,
    height: 300,
    autoFit: true,
    axis: {
      x: { label: { autoHide: true, autoRotate: false } },
    },
    annotations: [
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
        yField: (latest.UCL + latest.LCL) / 2,
        style: { stroke: "green", lineDash: [2, 2], lineWidth: 1 },
      },
    ],
  };

  const controlConfig = {
    data: data.flatMap((d) => [
      {
        time: d.time,
        value: d[selectedMetric],
        type: "Actual",
        status:
          d[selectedMetric] > d.UCL || d[selectedMetric] < d.LCL
            ? "alarm"
            : "normal",
      },
      { time: d.time, value: d.UCL, type: "UCL" },
      { time: d.time, value: d.LCL, type: "LCL" },
    ]),
    xField: "time",
    yField: "value",
    seriesField: "type",
    height: 400,
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
  };

  const tableData = [
    {
      key: 1,
      propertyName: "CAPACITANCE",
      count: 654,
      stdDev: 9.49,
      lcl: 291.36,
      mean: 319.85,
      ucl: 348.33,
      oocPoints: 119,
      oocPercent: 18,
    },
    {
      key: 2,
      propertyName: "FWD_1",
      count: 654,
      stdDev: 0,
      lcl: 5.0,
      mean: 5.0,
      ucl: 5.0,
      oocPoints: 0,
      oocPercent: 0,
    },
    {
      key: 3,
      propertyName: "FWD_10",
      count: 654,
      stdDev: 0,
      lcl: 50.0,
      mean: 50.0,
      ucl: 50.0,
      oocPoints: 0,
      oocPercent: 0,
    },
  ];

  const columns = [
    { title: "Property Name", dataIndex: "propertyName" },
    { title: "Count", dataIndex: "count" },
    { title: "Standard Deviation", dataIndex: "stdDev" },
    { title: "LCL (-3 sigma)", dataIndex: "lcl" },
    { title: "CL (Mean)", dataIndex: "mean" },
    { title: "UCL (+3 sigma)", dataIndex: "ucl" },
    { title: "OOC Points", dataIndex: "oocPoints" },
    {
      title: "OOC %",
      dataIndex: "oocPercent",
      render: (val) => `${val}%`,
    },
  ];

  const outOfControlCount = tableData.filter(
    (d) => d[selectedMetric] > d.UCL || d[selectedMetric] < d.LCL
  ).length;

  const lastAlarm = tableData.find(
    (d) => d[selectedMetric] > d.UCL || d[selectedMetric] < d.LCL
  );

  const selectedGeminiRecord = geminiOptions.find(
    (item) => item.value === selectedGemini
  );

  const histogramData = data.map((d) => ({
    value: d[selectedMetric],
  }));

  const histogramConfig = {
    data: histogramData,
    binField: "value",
    binNumber: 30,
    height: 400,
    color: "#73c0b0",
    columnStyle: {
      stroke: "#2f8f83",
      lineWidth: 0.5,
      fillOpacity: 0.7,
    },
    coordinate: { transform: [{ type: "transpose" }] },
    axis: {
      y: {
        min: latest.LCL - 10,
        max: latest.UCL + 10,
      },
    },
  };

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Header style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <img src={lamLogo} alt="LAM Research" style={{ height: 32, marginRight: 20 }} />
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
                    title="Tool Status"
                    value="RUN"
                    valueStyle={{ color: "green" }}
                  />
                </Card>
              </Col>
              <Col flex="auto">
                <Card size="small">
                  <Statistic title="Gemini" value={selectedGeminiRecord?.label} />
                </Card>
              </Col>
              <Col flex="auto">
                <Card size="small">
                  <Statistic title="Probe" value={selectedProbe} />
                </Card>
              </Col>
              <Col flex="auto">
                <Card size="small">
                  <Statistic title="Last Update" value={latest.time} />
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
                  <Statistic title="Cpk" value={1.67} precision={2} />
                </Card>
              </Col>
              <Col flex="auto">
                <Card size="small">
                  <Statistic
                    title="Last Alarm"
                    value={lastAlarm ? lastAlarm.time : "None"}
                  />
                </Card>
              </Col>
            </Row>

            <Row style={{ marginTop: 20 }}>
              <Col>
                <Select
                  value={selectedMetric}
                  onChange={(value) => setSelectedMetric(value)}
                  style={{ width: 220 }}
                  options={propertyOptions}
                />
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 20 }}>
              <Col span={18}>
                <Card title="SPC Control Chart">
                  <Line {...controlConfig} />
                </Card>
              </Col>
              <Col span={6}>
                <Card title="Distribution Histogram">
                  <Histogram {...histogramConfig} />
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
                  <Table
                    columns={columns}
                    dataSource={tableData}
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
