import sql from 'mssql';

const config = {
  server: 'Media.ruppin.ac.il',
  database: 'igroup104_test2',
  authentication: {
    type: 'default',
    options: {
      userName: 'igroup104',
      password: 'igroup104_76879'
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

console.log('Connecting to:', config.server, '/', config.database);

try {
  const pool = await sql.connect(config);
  const result = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.Apartments');
  console.log('✅ Connection successful!');
  console.log('   Rows in dbo.Apartments:', result.recordset[0].total);
  await pool.close();
} catch (err) {
  console.error('❌ Connection failed!');
  console.error('   Error:', err.message);
  if (err.code) console.error('   Code:', err.code);
}
