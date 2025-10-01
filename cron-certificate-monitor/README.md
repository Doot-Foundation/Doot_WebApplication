# DoH Certificate Monitor

Validates TLS certificates for DoH providers every 6 hours and stores results in Redis.

## Purpose

Monitors certificate fingerprints for:

- Cloudflare (1.1.1.1)
- Google (dns.google)
- Quad9 (9.9.9.9)
- AdGuard (dns.adguard.com)

## Integration

Other services (cron-update-all-prices-doh) automatically read these fingerprints:

```javascript
const redisKey = `doh:certificates:${providerName}`;
const cachedFingerprints = await redis.get(redisKey);
const fingerprints = JSON.parse(cachedFingerprints);
```

## Alerts

- ⚠️ Certificate changes trigger warnings in logs
- Railway will show failed runs if any provider fails
- Check Railway logs for detailed fingerprint comparisons

## Local Testing

```bash
# Install dependencies
npm install

# Run once
npm start
```
