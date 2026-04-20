import { Platform } from 'react-native';

export interface HealthSample {
  dataType: 'steps' | 'heart_rate' | 'sleep' | 'calories' | 'weight';
  value: number;
  recordedAt: string;
  source: 'apple' | 'google';
}

// ─── iOS / HealthKit ──────────────────────────────────────────────────────────

async function initHealthKit(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  const AppleHealthKit = (await import('react-native-health')).default;
  const { Permissions } = await import('react-native-health');

  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(
      {
        permissions: {
          read: [
            Permissions.Steps,
            Permissions.HeartRate,
            Permissions.SleepAnalysis,
            Permissions.ActiveEnergyBurned,
            Permissions.Weight,
          ],
        },
      },
      (err) => resolve(!err),
    );
  });
}

async function readHealthKitSamples(): Promise<HealthSample[]> {
  const ok = await initHealthKit();
  if (!ok) return [];

  const AppleHealthKit = (await import('react-native-health')).default;
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const opts = { startDate: yesterday.toISOString(), endDate: now.toISOString() };
  const samples: HealthSample[] = [];

  const steps = await new Promise<number>((resolve) => {
    AppleHealthKit.getStepCount(opts, (err, r) => resolve(err ? 0 : r.value));
  });
  if (steps > 0) samples.push({ dataType: 'steps', value: steps, recordedAt: now.toISOString(), source: 'apple' });

  const heartRates = await new Promise<number>((resolve) => {
    AppleHealthKit.getHeartRateSamples(opts, (err, r) => {
      if (err || !r.length) return resolve(0);
      const avg = r.reduce((s, x) => s + x.value, 0) / r.length;
      resolve(Math.round(avg));
    });
  });
  if (heartRates > 0) samples.push({ dataType: 'heart_rate', value: heartRates, recordedAt: now.toISOString(), source: 'apple' });

  const sleepSamples = await new Promise<number>((resolve) => {
    AppleHealthKit.getSleepSamples(opts, (err, r) => {
      if (err || !r.length) return resolve(0);
      const totalMin = r.reduce((s, x) => {
        const dur = (new Date(x.endDate).getTime() - new Date(x.startDate).getTime()) / 60000;
        return s + dur;
      }, 0);
      resolve(Math.round(totalMin));
    });
  });
  if (sleepSamples > 0) samples.push({ dataType: 'sleep', value: sleepSamples, recordedAt: now.toISOString(), source: 'apple' });

  const calories = await new Promise<number>((resolve) => {
    AppleHealthKit.getActiveEnergyBurned(opts, (err, r) => {
      if (err || !r.length) return resolve(0);
      resolve(Math.round(r.reduce((s, x) => s + x.value, 0)));
    });
  });
  if (calories > 0) samples.push({ dataType: 'calories', value: calories, recordedAt: now.toISOString(), source: 'apple' });

  const weights = await new Promise<number>((resolve) => {
    AppleHealthKit.getWeightSamples(
      { ...opts, limit: 1, ascending: false },
      (err, r) => resolve(err || !r.length ? 0 : Math.round(r[0].value * 10) / 10),
    );
  });
  if (weights > 0) samples.push({ dataType: 'weight', value: weights, recordedAt: now.toISOString(), source: 'apple' });

  return samples;
}

// ─── Android / Health Connect ─────────────────────────────────────────────────

async function readHealthConnectSamples(): Promise<HealthSample[]> {
  if (Platform.OS !== 'android') return [];

  const HC = await import('react-native-health-connect');
  const { SdkAvailabilityStatus } = HC;

  const status = await HC.getSdkStatus();
  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return [];

  const initialized = await HC.initialize();
  if (!initialized) return [];

  const granted = await HC.requestPermission([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'HeartRate' },
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
    { accessType: 'read', recordType: 'Weight' },
  ]);
  if (!granted.length) return [];

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const timeRange = { operator: 'between' as const, startTime: yesterday.toISOString(), endTime: now.toISOString() };
  const samples: HealthSample[] = [];

  try {
    const { records: stepRecs } = await HC.readRecords('Steps', { timeRangeFilter: timeRange });
    const totalSteps = stepRecs.reduce((s, r) => {
      if (r.recordType === 'Steps') return s + r.count;
      return s;
    }, 0);
    if (totalSteps > 0) samples.push({ dataType: 'steps', value: totalSteps, recordedAt: now.toISOString(), source: 'google' });
  } catch {}

  try {
    const { records: hrRecs } = await HC.readRecords('HeartRate', { timeRangeFilter: timeRange });
    let total = 0, count = 0;
    hrRecs.forEach((r) => {
      if (r.recordType === 'HeartRate') r.samples.forEach((s) => { total += s.beatsPerMinute; count++; });
    });
    if (count > 0) samples.push({ dataType: 'heart_rate', value: Math.round(total / count), recordedAt: now.toISOString(), source: 'google' });
  } catch {}

  try {
    const { records: sleepRecs } = await HC.readRecords('SleepSession', { timeRangeFilter: timeRange });
    const totalMin = sleepRecs.reduce((s, r) => {
      if (r.recordType === 'SleepSession') {
        return s + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
      }
      return s;
    }, 0);
    if (totalMin > 0) samples.push({ dataType: 'sleep', value: Math.round(totalMin), recordedAt: now.toISOString(), source: 'google' });
  } catch {}

  try {
    const { records: calRecs } = await HC.readRecords('ActiveCaloriesBurned', { timeRangeFilter: timeRange });
    const kcal = calRecs.reduce((s, r) => {
      if (r.recordType === 'ActiveCaloriesBurned') return s + r.energy.inKilocalories;
      return s;
    }, 0);
    if (kcal > 0) samples.push({ dataType: 'calories', value: Math.round(kcal), recordedAt: now.toISOString(), source: 'google' });
  } catch {}

  try {
    const { records: wtRecs } = await HC.readRecords('Weight', { timeRangeFilter: timeRange });
    const last = wtRecs[wtRecs.length - 1];
    if (last && last.recordType === 'Weight') {
      samples.push({ dataType: 'weight', value: Math.round(last.weight.inKilograms * 10) / 10, recordedAt: now.toISOString(), source: 'google' });
    }
  } catch {}

  return samples;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readNativeHealthSamples(): Promise<HealthSample[]> {
  if (Platform.OS === 'ios') return readHealthKitSamples();
  if (Platform.OS === 'android') return readHealthConnectSamples();
  return [];
}
