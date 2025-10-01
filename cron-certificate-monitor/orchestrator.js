require('dotenv').config();
const { monitorCertificates } = require('./src/certificateMonitor');

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('   DoH CERTIFICATE MONITORING SERVICE');
  console.log('   Running validation checks...');
  console.log('════════════════════════════════════════════════\n');

  try {
    const startTime = Date.now();

    const result = await monitorCertificates();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n════════════════════════════════════════════════');
    console.log(`   VALIDATION COMPLETE (${duration}s)`);
    console.log(`   Providers checked: ${result.totalProviders}`);
    console.log(`   Valid: ${result.validProviders}`);
    console.log(`   Changed: ${result.changedProviders}`);
    console.log(`   Failed: ${result.failedProviders}`);
    console.log('════════════════════════════════════════════════\n');

    if (result.changedProviders > 0) {
      console.warn('⚠️  CERTIFICATE CHANGES DETECTED!');
      console.warn('⚠️  Review logs and update pinned fingerprints if legitimate.\n');
    }

    // Exit with appropriate code
    process.exit(result.failedProviders > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
