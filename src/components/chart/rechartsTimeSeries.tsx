import './rechartsTimeSeries.css'

import Crop32Icon from '@mui/icons-material/Crop169'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'
import { Fragment, useEffect, useState } from 'react'
import React from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatTimestamp, TimeFormat } from '../helper'

export interface TimeSeriesData {
  timestamp: number
  [key: string]: number
}

export interface Margin {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export interface RechartsTimeSeriesProps {
  /** Data to be displayed in the time series chart. The first field is used as the x-axis field. We currently support formatting epoch timestamps and ISO date strings. Other data types will be displayed as given. */
  timeSeries: TimeSeriesData[]
  /** An array containing a predefined set of Hex color codes or string colors (e.g. 'blue'). The colors will be applied to the keys of the data object in order. */
  chartColors: string[]
  /** Array of y-axis reference lines. */
  referenceLineYAxis?: number[]
  /** Array of y-axis reference line colors. Hex color codes and string colors are both supported for defining colors. If not provided, all lines default to grey. Skip providing a custom color for a certain y-axis by providing an empty string. */
  referenceLineColor?: string[]
  /** Array of y-axis reference line labels. Skip providing a custom label for a certain y-axis by providing an empty string. */
  referenceLineLabel?: string[]
  /** Array of y-axis reference line stroke widths. If not provided, all lines default to 1. Skip providing a custom stroke width for a certain y-axis by providing an empty string. */
  referenceLineStrokeWidth?: number[]
  /** Title of the time series chart. */
  title?: string
  /** Description of the time series chart. */
  description?: string
  // TODO: define onClick type - task <5991977827>
  /** Callback function to be called when a point on the graph is clicked. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (...args: any[]) => any
  /** Width of the y-axis labels in pixels. */
  yAxisLabelWidth?: number
  /** Minimum width of the chart in pixels. */
  minChartWidth?: number
  /** Maximum width of the chart in pixels. */
  maxHeight?: number
  /** Updated data will be added to the original time series data. */
  updatedData?: { timeSeries: TimeSeriesData[] }[]
  /** Aspect ratio of the chart. */
  aspectRatio?: number
  /** Width of the chart in pixels. */
  width?: number
  /** Chart type toggle will be hidden if the value is true. */
  disableChartTypeToggle?: boolean
  /** Define the default chart type: 'line', 'bar', or 'area'. */
  defaultChartType?: TimeSeriesType
  /** Pass a function to format y-axis label. Make sure to use tooltipFormatter and yAxisTickFormatter together so that the numbers are uniform. */
  yAxisTickFormatter?: (value: number) => string
  /** Pass a function to format tooltip content. */
  tooltipFormatter?: (value: number, name: string) => [string, string]
  /** Margin of chart container in pixel. For example, adding left margin could show larger numbers properly. */
  chartContainerMargin?: Margin
}

export type TimeSeriesType = 'line' | 'bar' | 'area'

const TimeSeriesComponents = {
  line: LineChart,
  bar: BarChart,
  area: AreaChart,
}

//All of lines should be shown initially
function showAllDatasets(yAxisFields: string[]) {
  const initialVisibility: { [key: string]: boolean } = {}

  yAxisFields.forEach((yAxisField) => {
    initialVisibility[yAxisField] = true
  })

  return initialVisibility
}

function areAllDatasetsVisible(datasetsVisibility: { [key: string]: boolean }) {
  return Object.values(datasetsVisibility).every((value) => value === true)
}

function RechartsTimeSeries(props: RechartsTimeSeriesProps) {
  const [timeSeriesType, setTimeSeriesType] = useState<TimeSeriesType>(
    props.defaultChartType || 'line'
  )
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [timeSeries, setTimeSeries] = useState<object[]>(props.timeSeries)

  const dataFields = timeSeries.length > 0 ? Object.keys(timeSeries[0]) : []
  const xAxisField = dataFields[0]
  const yAxisFields = dataFields.slice(1)

  const [datasetsVisibility, setDatasetsVisibility] = useState<{
    [key: string]: boolean
  }>(showAllDatasets(yAxisFields))

  useEffect(() => {
    if (props.updatedData && props.updatedData.length > 0) {
      let newData = [...props.timeSeries]
      props.updatedData.forEach((data) => {
        newData = newData.concat(data.timeSeries)
        setTimeSeries(newData)
      })
    }
  }, [props.timeSeries, props.updatedData])

  const TimeSeriesParentComponent = TimeSeriesComponents[timeSeriesType]

  function handleChartTypeToggle(event?: React.MouseEvent<HTMLElement>) {
    anchorEl ? setAnchorEl(null) : event && setAnchorEl(event.currentTarget)
  }

  function handleChartTypeClick(chartType: TimeSeriesType) {
    setTimeSeriesType(chartType)
    handleChartTypeToggle()
  }

  function handleLegendClick(clickedDataKey: string) {
    const isTheOnlyVisibleDataset =
      datasetsVisibility[clickedDataKey] &&
      !yAxisFields.find(
        (key) => key !== clickedDataKey && datasetsVisibility[key]
      )

    // If all lines are initially visible, only show the selected line and hide other lines
    if (areAllDatasetsVisible(datasetsVisibility)) {
      const newDatasetsVisibility: { [key: string]: boolean } = {}
      for (const key of yAxisFields) {
        const isSelected = key === clickedDataKey
        newDatasetsVisibility[key] = isSelected
      }
      setDatasetsVisibility(newDatasetsVisibility)
    } else {
      // If the clicked line is the only visible line, reset visibility to initial state
      if (isTheOnlyVisibleDataset) {
        setDatasetsVisibility(showAllDatasets(yAxisFields))
      } else {
        // Otherwise, toggle the visibility of the clicked line
        setDatasetsVisibility({
          ...datasetsVisibility,
          [clickedDataKey]: !datasetsVisibility[clickedDataKey],
        })
      }
    }
  }

  function renderChartComponent(key: string, index: number) {
    const colorIndex = index % props.chartColors.length
    const chartColor = datasetsVisibility[key]
      ? props.chartColors[colorIndex]
      : 'transparent'

    const onClickFields = {
      onClick: props.onClick,
      cursor: 'pointer',
    }

    switch (timeSeriesType) {
      case 'line':
        return (
          <Line
            type="monotone"
            // TODO make animation configurable - task <5870438845>
            isAnimationActive={false}
            dataKey={key}
            name={key}
            key={key}
            dot={false}
            stroke={chartColor}
            activeDot={props.onClick && onClickFields}
          />
        )
      case 'bar':
        return (
          <Bar
            key={key}
            dataKey={key}
            fill={chartColor}
            onClick={props.onClick && onClickFields.onClick}
            cursor={props.onClick && onClickFields.cursor}
          />
        )
      case 'area':
        return (
          <Fragment key={key}>
            <defs>
              <linearGradient id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              key={key}
              isAnimationActive={false}
              dataKey={key}
              type="monotone"
              stroke={chartColor}
              fillOpacity={1}
              fill={`url(#color${key})`}
              activeDot={props.onClick && onClickFields}
            />
          </Fragment>
        )
    }
  }

  function getLegendColor(dataKey: string, index: number): string {
    return datasetsVisibility[dataKey]
      ? props.chartColors[index % props.chartColors.length]
      : 'grey'
  }

  function getLegendTextDecorationStyle(dataKey: string): string {
    return datasetsVisibility[dataKey] ? 'none' : 'line-through'
  }

  function calculateTimeDuration(): number {
    const lastTimeSeriesItem = props.timeSeries[props.timeSeries.length - 1]
    const firstTimeSeriesItem = props.timeSeries[0]

    const timeDifference =
      lastTimeSeriesItem[xAxisField] - firstTimeSeriesItem[xAxisField]

    const durationInDays =
      // eslint-disable-next-line no-magic-numbers
      props.timeSeries.length > 0 ? timeDifference / (1000 * 60 * 60 * 24) : 0

    return durationInDays
  }

  function formatTimeLabel(timestamp: number) {
    const durationInDays = calculateTimeDuration()

    if (durationInDays <= 1) {
      return formatTimestamp(timestamp, TimeFormat.HOUR)
    } else {
      return formatTimestamp(timestamp, TimeFormat.MONTH_DATE)
    }
  }

  function renderLegend() {
    return (
      <Box className="rustic-recharts-time-series-legend">
        {yAxisFields.map((dataKey, index) => (
          <Box
            key={index}
            className="rustic-recharts-time-series-legend-item"
            onClick={() => handleLegendClick(dataKey)}
            data-cy="legend-item"
          >
            <Crop32Icon
              sx={{
                color: getLegendColor(dataKey, index),
              }}
            />
            <Typography
              variant="body2"
              display="inline"
              sx={{
                color: getLegendColor(dataKey, index),
                textDecorationLine: getLegendTextDecorationStyle(dataKey),
              }}
            >
              {dataKey}
            </Typography>
          </Box>
        ))}
      </Box>
    )
  }
  if (timeSeries.length === 0) {
    return <Typography variant="body2">No data available</Typography>
  } else {
    return (
      <Box
        className="rustic-recharts-time-series"
        data-cy={`${timeSeriesType}-chart`}
      >
        {!props.disableChartTypeToggle && (
          <FormControl className="rustic-recharts-time-series-chart-toggle">
            <IconButton
              aria-label="chart options"
              aria-expanded={Boolean(anchorEl)}
              aria-haspopup="true"
              onClick={handleChartTypeToggle}
            >
              <MoreVertIcon sx={{ color: 'primary.main' }} />
            </IconButton>
            <Menu
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={(e: React.MouseEvent<HTMLElement>) =>
                handleChartTypeToggle(e)
              }
            >
              <Typography className="rustic-recharts-time-series-chart-toggle-title">
                Chart Types:
              </Typography>
              {Object.keys(TimeSeriesComponents).map((chartType) => {
                return (
                  <MenuItem
                    value={chartType}
                    key={chartType}
                    selected={chartType === timeSeriesType}
                    onClick={() =>
                      handleChartTypeClick(chartType as TimeSeriesType)
                    }
                  >
                    {chartType.charAt(0).toUpperCase() + chartType.slice(1)}{' '}
                    Chart
                  </MenuItem>
                )
              })}
            </Menu>
          </FormControl>
        )}
        <Box>
          {props.title && (
            <Typography
              variant="subtitle2"
              className="rustic-recharts-time-series-title"
              data-cy="time-series-title"
            >
              {props.title}
            </Typography>
          )}

          {props.description && (
            <Typography
              variant="caption"
              className="rustic-recharts-time-series-description"
            >
              {props.description}
            </Typography>
          )}

          <ResponsiveContainer
            aspect={props.aspectRatio}
            width={props.width}
            maxHeight={props.maxHeight}
            minWidth={props.minChartWidth}
          >
            <TimeSeriesParentComponent
              data={timeSeries}
              margin={props.chartContainerMargin}
            >
              <XAxis dataKey={xAxisField} tickFormatter={formatTimeLabel} />
              <YAxis
                domain={['auto', 'auto']}
                width={props.yAxisLabelWidth}
                tickFormatter={props.yAxisTickFormatter}
              />
              <Tooltip
                labelFormatter={(label: number) => [formatTimeLabel(label)]}
                formatter={props.tooltipFormatter}
              />
              <Legend content={renderLegend} />

              {yAxisFields.map((key, index) =>
                datasetsVisibility[key]
                  ? renderChartComponent(key, index)
                  : null
              )}
              {props.referenceLineYAxis &&
                props.referenceLineYAxis.map((referenceLine, index) => {
                  return (
                    <ReferenceLine
                      key={index}
                      y={referenceLine}
                      label={
                        props.referenceLineLabel &&
                        props.referenceLineLabel[index]
                      }
                      stroke={
                        props.referenceLineColor &&
                        props.referenceLineColor[index]
                      }
                      strokeDasharray="3 3"
                      ifOverflow="extendDomain"
                      strokeWidth={
                        props.referenceLineStrokeWidth &&
                        props.referenceLineStrokeWidth[index]
                      }
                      isFront
                    />
                  )
                })}
            </TimeSeriesParentComponent>
          </ResponsiveContainer>
        </Box>
      </Box>
    )
  }
}

RechartsTimeSeries.defaultProps = {
  minChartWidth: 200,
  maxHeight: 600,
  yAxisLabelWidth: 30,
  // eslint-disable-next-line no-magic-numbers
  aspectRatio: 16 / 9,
  disableChartTypeToggle: false,
}

export default RechartsTimeSeries
