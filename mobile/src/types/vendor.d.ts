declare module 'react-native-health' {
  export interface HealthValue {
    value: number;
    startDate: string;
    endDate: string;
  }

  export interface SampleQueryOptions {
    startDate: string;
    endDate: string;
    ascending?: boolean;
    limit?: number;
  }

  export interface SleepSample {
    value: string;
    startDate: string;
    endDate: string;
  }

  export enum HKActivityType {}

  export const Permissions: {
    Steps: string;
    HeartRate: string;
    SleepAnalysis: string;
    ActiveEnergyBurned: string;
    Weight: string;
    DistanceWalkingRunning: string;
  };

  interface AppleHealthKit {
    initHealthKit(
      permissions: { permissions: { read: string[]; write?: string[] } },
      callback: (error: string | null, result: Record<string, unknown>) => void
    ): void;
    getStepCount(
      options: SampleQueryOptions & { date?: string },
      callback: (error: string | null, result: { value: number }) => void
    ): void;
    getHeartRateSamples(
      options: SampleQueryOptions,
      callback: (error: string | null, results: HealthValue[]) => void
    ): void;
    getSleepSamples(
      options: SampleQueryOptions,
      callback: (error: string | null, results: SleepSample[]) => void
    ): void;
    getActiveEnergyBurned(
      options: SampleQueryOptions,
      callback: (error: string | null, results: HealthValue[]) => void
    ): void;
    getWeightSamples(
      options: SampleQueryOptions,
      callback: (error: string | null, results: HealthValue[]) => void
    ): void;
  }

  const AppleHealthKit: AppleHealthKit;
  export default AppleHealthKit;
}

declare module 'react-native-health-connect' {
  export type HealthConnectRecord =
    | { recordType: 'Steps'; count: number; startTime: string; endTime: string }
    | { recordType: 'HeartRate'; samples: { time: string; beatsPerMinute: number }[]; startTime: string; endTime: string }
    | { recordType: 'SleepSession'; startTime: string; endTime: string }
    | { recordType: 'ActiveCaloriesBurned'; energy: { inKilocalories: number }; startTime: string; endTime: string }
    | { recordType: 'Weight'; weight: { inKilograms: number }; time: string };

  export type RecordType = 'Steps' | 'HeartRate' | 'SleepSession' | 'ActiveCaloriesBurned' | 'Weight';

  export interface Permission {
    accessType: 'read' | 'write';
    recordType: RecordType;
  }

  export function initialize(): Promise<boolean>;
  export function requestPermission(permissions: Permission[]): Promise<Permission[]>;
  export function readRecords(
    recordType: RecordType,
    options: { timeRangeFilter: { operator: 'between'; startTime: string; endTime: string } }
  ): Promise<{ records: HealthConnectRecord[] }>;
  export function getSdkStatus(): Promise<number>;

  export const SdkAvailabilityStatus: {
    SDK_UNAVAILABLE: number;
    SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: number;
    SDK_AVAILABLE: number;
  };
}

declare module 'expo-constants' {
  const Constants: {
    expoConfig?: {
      name?: string;
      slug?: string;
      extra?: {
        eas?: { projectId?: string };
        [key: string]: unknown;
      };
    };
    manifest?: Record<string, unknown>;
  };
  export default Constants;
}

declare module 'expo-notifications' {
  export interface NotificationContent {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
    sound?: string | boolean;
    badge?: number;
  }

  export interface Notification {
    request: { content: NotificationContent; identifier: string };
    date: number;
  }

  export interface NotificationResponse {
    notification: Notification;
    actionIdentifier: string;
  }

  export interface NotificationHandler {
    handleNotification: (n: Notification) => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
      shouldShowBanner?: boolean;
      shouldShowList?: boolean;
    }>;
  }

  export interface ExpoPushToken {
    data: string;
    type: string;
  }

  export interface PermissionResponse {
    status: 'granted' | 'denied' | 'undetermined';
    expires: string;
    granted: boolean;
    canAskAgain: boolean;
  }

  export function setNotificationHandler(handler: NotificationHandler): void;

  export function addNotificationResponseReceivedListener(
    listener: (response: NotificationResponse) => void
  ): { remove: () => void };

  export function addNotificationReceivedListener(
    listener: (notification: Notification) => void
  ): { remove: () => void };

  export function getPermissionsAsync(): Promise<PermissionResponse>;
  export function requestPermissionsAsync(): Promise<PermissionResponse>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<ExpoPushToken>;
  export function setBadgeCountAsync(count: number): Promise<boolean>;
}
