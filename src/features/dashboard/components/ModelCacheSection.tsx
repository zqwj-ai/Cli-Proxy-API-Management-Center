import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { modelCacheStatsApi, type ModelCacheStatsResponse } from '@/services/api';
import { Meter } from './Meter';
import { Sparkline } from './Sparkline';
import styles from '../dashboard.module.scss';

const REFRESH_INTERVAL_MS = 30 * 1000;
const WINDOW_HOURS = 24;

const formatTokens = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

const formatRate = (rate: number): string => `${(rate * 100).toFixed(1)}%`;

export function ModelCacheSection() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ModelCacheStatsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await modelCacheStatsApi.getStats(WINDOW_HOURS);
        if (!cancelled) setStats(data);
      } catch {
        // The endpoint only exists on proxies with cache statistics support;
        // keep the section empty instead of surfacing an error.
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const models = stats?.models ?? [];

  return (
    <section className={styles.section}>
      <header className={styles.sectionHead}>
        <span className={styles.eyebrow}>{t('dashboard.cache_eyebrow')}</span>
        <h2 className={styles.sectionTitle}>{t('dashboard.cache_title')}</h2>
        <p className={styles.sectionDescription}>
          {t('dashboard.cache_description', { hours: stats?.window_hours ?? WINDOW_HOURS })}
        </p>
      </header>
      <div className={styles.panel}>
        {models.length === 0 ? (
          <p className={styles.emptyNote}>{t('dashboard.cache_empty')}</p>
        ) : (
          <ul className={styles.fleetList}>
            {models.map((entry, index) => (
              <li key={entry.model} className={styles.fleetRow}>
                <span className={styles.fleetRank} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className={styles.fleetIdentity}>
                  <span className={styles.fleetName}>{entry.model}</span>
                  <span className={styles.fleetMeta}>
                    {t('dashboard.cache_tokens_meta', {
                      read: formatTokens(entry.cache_read_tokens),
                      uncached: formatTokens(entry.uncached_input_tokens),
                    })}
                    {' · '}
                    {t('dashboard.cache_request_rate', {
                      value: formatRate(entry.request_hit_rate),
                    })}
                  </span>
                </div>
                <Sparkline
                  points={(entry.hourly ?? []).map((bucket) =>
                    bucket.input_tokens > 0 ? bucket.cache_read_tokens / bucket.input_tokens : 0
                  )}
                  ariaLabel={t('dashboard.cache_spark_label', { model: entry.model })}
                  className={styles.fleetSpark}
                />
                <div className={styles.fleetNumbers}>
                  <span className={styles.fleetTotal}>{entry.requests.toLocaleString()}</span>
                  <span className={styles.fleetTotalLabel}>{t('dashboard.cache_requests')}</span>
                </div>
                <div className={styles.fleetRate}>
                  <span className={styles.fleetRateValue}>{formatRate(entry.token_hit_rate)}</span>
                  <Meter
                    value={entry.token_hit_rate * 100}
                    ariaLabel={t('dashboard.cache_token_rate')}
                    className={styles.fleetMeter}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
