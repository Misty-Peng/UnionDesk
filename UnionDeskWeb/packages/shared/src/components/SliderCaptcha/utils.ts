/**
 * 滑块验证工具函数
 */

import type { TrackPoint, VerifyResult } from './types';

/**
 * 生成随机字符串
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成验证 token
 */
export function generateToken(): string {
  const timestamp = Date.now();
  const random = generateRandomString(16);
  return `${timestamp}_${random}`;
}

/**
 * 验证滑动轨迹
 * 检测是否为人类操作（非机器人）
 */
export function verifyTrack(track: TrackPoint[], threshold: number): VerifyResult {
  if (track.length < 2) {
    return {
      success: false,
      message: '滑动轨迹过短',
    };
  }

  // 计算总时长
  const duration = track[track.length - 1].t - track[0].t;

  // 时长过短，可能是机器人
  if (duration < 100) {
    return {
      success: false,
      message: '滑动速度过快',
    };
  }

  // 计算平均速度
  const distance = track[track.length - 1].x - track[0].x;
  const avgSpeed = distance / duration;

  // 速度过快，可能是机器人
  if (avgSpeed > 5) {
    return {
      success: false,
      message: '滑动速度异常',
    };
  }

  // 检查是否到达阈值
  const finalPosition = track[track.length - 1].x;
  if (finalPosition < threshold * 0.95) {
    return {
      success: false,
      message: '未滑动到最右边',
    };
  }

  // 验证通过，生成 token
  return {
    success: true,
    token: generateToken(),
  };
}

/**
 * 计算滑块位置百分比
 */
export function calculateProgress(current: number, max: number): number {
  return Math.min(Math.max((current / max) * 100, 0), 100);
}
