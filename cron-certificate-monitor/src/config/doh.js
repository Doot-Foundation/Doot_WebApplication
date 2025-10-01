const PINNED_CERTIFICATES = {
  cloudflare: {
    // Primary: cloudflare-dns.com
    name: "Cloudflare",
    hostname: "cloudflare-dns.com",
    path: "/dns-query",
    fingerprints: {
      sha256: [
        "SPfg6FluPIlUc6a5h313BDCxQYNGX+THTy7ig5X3+VA=",
        "3b0kD4uRxwCxDmuBS9ZAFX4KrSV/B2S1FK67Lc5kcPU=",
        "YZPgTZ+woNCCCIW3LH2CxQeLzB/1m42QcCTBSdgayjs=",
      ],
    },
  },
  google: {
    // Primary: dns.google
    name: "Google",
    hostname: "dns.google",
    path: "/resolve",
    fingerprints: {
      sha256: [
        "kGFXXqU9M5Ro7jPA0MpCdbM5T3P8uU+JE3nu/CXd0Ic=",
        "CFPCh1qXoX82LQ+tJtrjUrJzYvRWAIu5VQs0sDuU1EA=",
        "8P8Rh6NGH3QryL5vSaha+Ux3TYgpzBSnAUzpyhPVZt0=",
      ],
    },
  },
  quad9: {
    // Primary: dns.quad9.net
    name: "Quad9",
    hostname: "dns.quad9.net",
    path: "/dns-query",
    fingerprints: {
      sha256: [
        "i2kObfz0qIKCGNWt7MjBUeSrh0Dyjb0/zWINImZES+I=",
        "0Oxjdx/KBc7jqoVuC5ryUeFvsM+zp07v2PVf1k34bfw=",
        "W9QP7MHLZ5r1Kg4sNw8DgloHvVmxb/mTiN0q7NyJ9hM=",
      ],
    },
  },
  adguard: {
    // Primary: dns.adguard.com
    name: "AdGuard",
    hostname: "dns.adguard.com",
    path: "/dns-query",
    fingerprints: {
      sha256: [
        "BVWqvuK5dTmVnYOuLO7Vr03Y1pKAuDettDoamujSXRk=",
        "dgAzp2/FEF+PFv76x0NRH5vzDaihmBR4zrkRVmkWP60=",
        "zdO6pMWk4/Lg7OZaRQ9XpCGw6kH9aUDXxZ/iCVJlcMA=",
      ],
    },
  },
};

const DOH_PROVIDERS = [
  PINNED_CERTIFICATES.cloudflare,
  PINNED_CERTIFICATES.google,
  PINNED_CERTIFICATES.quad9,
  PINNED_CERTIFICATES.adguard,
];

module.exports = {
  DOH_PROVIDERS,
};
