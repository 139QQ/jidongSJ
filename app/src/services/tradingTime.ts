/**
 * 交易时间管理模块
 * @module services/tradingTime
 * @description 管理基金交易时间、节假日休市安排和交易状态检查
 */

/** 交易时间段定义 */
export interface TradingSession {
  name: string;
  startTime: string; // HH:mm 格式
  endTime: string;   // HH:mm 格式
}

/** 节假日安排 */
export interface HolidayInfo {
  name: string;
  startDate: string; // YYYY-MM-DD 格式
  endDate: string;   // YYYY-MM-DD 格式
  days: number;      // 休市天数
}

/** 交易时间配置 */
export interface TradingTimeConfig {
  sessions: TradingSession[];
  holidays: HolidayInfo[];
  weekendClosed: boolean;
}

/** 默认交易时间配置 - 2026 年 */
export const defaultTradingTimeConfig: TradingTimeConfig = {
  sessions: [
    {
      name: '上午交易时段',
      startTime: '09:30',
      endTime: '11:30'
    },
    {
      name: '下午交易时段',
      startTime: '13:00',
      endTime: '15:00'
    }
  ],
  holidays: [
    {
      name: '元旦',
      startDate: '2026-01-01',
      endDate: '2026-01-03',
      days: 3
    },
    {
      name: '春节',
      startDate: '2026-02-15',
      endDate: '2026-02-23',
      days: 9
    },
    {
      name: '清明节',
      startDate: '2026-04-04',
      endDate: '2026-04-06',
      days: 3
    },
    {
      name: '劳动节',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      days: 5
    },
    {
      name: '端午节',
      startDate: '2026-06-19',
      endDate: '2026-06-21',
      days: 3
    },
    {
      name: '中秋节',
      startDate: '2026-09-25',
      endDate: '2026-09-27',
      days: 3
    },
    {
      name: '国庆节',
      startDate: '2026-10-01',
      endDate: '2026-10-07',
      days: 7
    }
  ],
  weekendClosed: true
};

/** 当前配置 */
let currentConfig: TradingTimeConfig = { ...defaultTradingTimeConfig };

/**
 * 获取当前配置
 * @returns {TradingTimeConfig} 当前交易时间配置
 */
export function getTradingTimeConfig(): TradingTimeConfig {
  return { ...currentConfig };
}

/**
 * 更新配置
 * @param {Partial<TradingTimeConfig>} config - 要更新的配置项
 */
export function updateTradingTimeConfig(config: Partial<TradingTimeConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * 重置配置为默认值
 */
export function resetTradingTimeConfig(): void {
  currentConfig = { ...defaultTradingTimeConfig };
}

/**
 * 检查是否是周末
 * @param {Date} date - 要检查的日期
 * @returns {boolean} 如果是周末返回 true
 */
export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = 周日，6 = 周六
}

/**
 * 检查是否是节假日
 * @param {Date} date - 要检查的日期
 * @returns {boolean} 如果是节假日返回 true
 */
export function isHoliday(date: Date = new Date()): boolean {
  const dateStr = formatDate(date);
  
  for (const holiday of currentConfig.holidays) {
    if (dateStr >= holiday.startDate && dateStr <= holiday.endDate) {
      return true;
    }
  }
  
  return false;
}

/**
 * 检查是否是交易日
 * @param {Date} date - 要检查的日期
 * @returns {boolean} 如果是交易日返回 true
 */
export function isTradingDay(date: Date = new Date()): boolean {
  if (currentConfig.weekendClosed && isWeekend(date)) {
    return false;
  }
  
  if (isHoliday(date)) {
    return false;
  }
  
  return true;
}

/**
 * 检查当前是否在交易时间内
 * @param {Date} date - 要检查的日期时间，默认为当前时间
 * @returns {boolean} 如果在交易时间内返回 true
 */
export function isTradingTime(date: Date = new Date()): boolean {
  // 首先检查是否是交易日
  if (!isTradingDay(date)) {
    return false;
  }
  
  const currentTime = formatTime(date);
  
  // 检查是否在任何交易时段内
  for (const session of currentConfig.sessions) {
    if (currentTime >= session.startTime && currentTime <= session.endTime) {
      return true;
    }
  }
  
  return false;
}

/**
 * 获取下一个交易日
 * @param {Date} startDate - 起始日期，默认为当前日期
 * @returns {Date} 下一个交易日
 */
export function getNextTradingDay(startDate: Date = new Date()): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  
  while (!isTradingDay(date)) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
}

/**
 * 获取上一个交易日
 * @param {Date} endDate - 结束日期，默认为当前日期
 * @returns {Date} 上一个交易日
 */
export function getPreviousTradingDay(endDate: Date = new Date()): Date {
  const date = new Date(endDate);
  date.setDate(date.getDate() - 1);
  date.setHours(0, 0, 0, 0);
  
  while (!isTradingDay(date)) {
    date.setDate(date.getDate() - 1);
  }
  
  return date;
}

/**
 * 获取距离下一个交易日的天数
 * @param {Date} date - 当前日期
 * @returns {number} 距离下一个交易日的天数
 */
export function getDaysToNextTradingDay(date: Date = new Date()): number {
  const now = new Date(date);
  now.setHours(0, 0, 0, 0);
  
  const nextTradingDay = getNextTradingDay(now);
  const diffTime = nextTradingDay.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * 获取距离下一个交易时段的分钟数
 * @param {Date} date - 当前日期时间
 * @returns {number} 距离下一个交易时段的分钟数，如果已在交易时段内返回 0
 */
export function getMinutesToNextSession(date: Date = new Date()): number {
  if (isTradingTime(date)) {
    return 0;
  }
  
  const currentTime = formatTime(date);
  
  // 检查今天是否是交易日
  if (isTradingDay(date)) {
    // 检查是否在今天的第一时段之前
    const firstSession = currentConfig.sessions[0];
    if (currentTime < firstSession.startTime) {
      return getTimeDiffInMinutes(currentTime, firstSession.startTime);
    }
    
    // 检查是否在两个时段之间
    for (let i = 0; i < currentConfig.sessions.length - 1; i++) {
      const currentSession = currentConfig.sessions[i];
      const nextSession = currentConfig.sessions[i + 1];
      
      if (currentTime > currentSession.endTime && currentTime < nextSession.startTime) {
        return getTimeDiffInMinutes(currentTime, nextSession.startTime);
      }
    }
  }
  
  // 如果今天不是交易日或已过今天的最后时段，返回明天第一时段的分钟数
  const nextTradingDay = getNextTradingDay(date);
  const firstSession = currentConfig.sessions[0];
  const tomorrowStr = formatDate(nextTradingDay);
  
  // 计算从当前时间到明天第一时段的分钟数
  const now = new Date(date);
  const tomorrowMorning = new Date(`${tomorrowStr}T${firstSession.startTime}:00`);
  const diffMs = tomorrowMorning.getTime() - now.getTime();
  
  return Math.ceil(diffMs / (1000 * 60));
}

/**
 * 获取当前交易状态信息
 * @param {Date} date - 要检查的日期时间，默认为当前时间
 * @returns {TradingStatusInfo} 交易状态信息
 */
export function getTradingStatus(date: Date = new Date()): TradingStatusInfo {
  const isWeekendDay = isWeekend(date);
  const isHolidayDay = isHoliday(date);
  const isTradingDayFlag = isTradingDay(date);
  const isTradingTimeFlag = isTradingTime(date);
  
  let status: 'trading' | 'closed' | 'preMarket' | 'afterMarket' = 'closed';
  let message = '';
  
  if (isWeekendDay) {
    status = 'closed';
    message = '周末休市';
  } else if (isHolidayDay) {
    status = 'closed';
    const holiday = currentConfig.holidays.find(h => 
      formatDate(date) >= h.startDate && formatDate(date) <= h.endDate
    );
    message = holiday ? `${holiday.name}休市` : '节假日休市';
  } else if (!isTradingTimeFlag) {
    const currentTime = formatTime(date);
    const firstSession = currentConfig.sessions[0];
    const lastSession = currentConfig.sessions[currentConfig.sessions.length - 1];
    
    if (currentTime < firstSession.startTime) {
      status = 'preMarket';
      message = '盘前准备';
    } else if (currentTime > lastSession.endTime) {
      status = 'afterMarket';
      message = '已收盘';
    } else {
      status = 'closed';
      message = '午休时间';
    }
  } else {
    status = 'trading';
    message = '交易中';
  }
  
  return {
    isWeekend: isWeekendDay,
    isHoliday: isHolidayDay,
    isTradingDay: isTradingDayFlag,
    isTradingTime: isTradingTimeFlag,
    status,
    message,
    nextTradingDay: getNextTradingDay(date),
    daysToNextTradingDay: getDaysToNextTradingDay(date),
    minutesToNextSession: getMinutesToNextSession(date)
  };
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date} date - 要格式化的日期
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH:mm 格式
 * @param {Date} date - 要格式化的日期
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 计算两个时间字符串之间的分钟差
 * @param {string} startTime - 开始时间 (HH:mm)
 * @param {string} endTime - 结束时间 (HH:mm)
 * @returns {number} 分钟差
 */
function getTimeDiffInMinutes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return endTotalMinutes - startTotalMinutes;
}

/** 交易状态信息接口 */
export interface TradingStatusInfo {
  isWeekend: boolean;
  isHoliday: boolean;
  isTradingDay: boolean;
  isTradingTime: boolean;
  status: 'trading' | 'closed' | 'preMarket' | 'afterMarket';
  message: string;
  nextTradingDay: Date;
  daysToNextTradingDay: number;
  minutesToNextSession: number;
}

/**
 * 获取 2026 年节假日安排文本
 * @returns {string} 节假日安排文本
 */
export function getHolidayScheduleText(): string {
  let text = '2026 年基金市场节假日休市安排\n\n';
  
  for (const holiday of currentConfig.holidays) {
    text += `${holiday.name}: ${holiday.startDate} 至 ${holiday.endDate} (休市${holiday.days}天)\n`;
  }
  
  text += '\n日常交易时间:\n';
  text += '上午：09:30 - 11:30\n';
  text += '下午：13:00 - 15:00\n';
  text += '周末：周六、周日休市\n';
  
  return text;
}

export default {
  getTradingTimeConfig,
  updateTradingTimeConfig,
  resetTradingTimeConfig,
  isWeekend,
  isHoliday,
  isTradingDay,
  isTradingTime,
  getNextTradingDay,
  getPreviousTradingDay,
  getDaysToNextTradingDay,
  getMinutesToNextSession,
  getTradingStatus,
  getHolidayScheduleText
};
