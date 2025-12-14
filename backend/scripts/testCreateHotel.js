const axios = require('axios');

async function run() {
  try {
    // 1) login as superadmin
    const loginRes = await axios.post('http://localhost:4000/api/auth/superadmin/login', {
      email: 'rohitcs175@gmail.com',
      password: 'Kali@8320191025'
    }, { timeout: 5000 });

    const token = loginRes.data?.token;
    if (!token) {
      console.error('No token returned from login:', loginRes.data);
      process.exit(1);
    }

    console.log('Got token, creating hotel...');

    const payload = {
      name: 'Test Hotel from script',
      address: '123 Script St, Test City',
      owner_name: 'Script Owner',
      owner_email: `script-owner+${Date.now()}@example.com`,
      owner_phone: '+911234567890',
      subscription_start: new Date().toISOString(),
      subscription_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      admin: { email: `admin+${Date.now()}@example.com`, password: 'AdminPass123!' }
    };

    const createRes = await axios.post('http://localhost:4000/api/superadmin/hotels', payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000
    });

    console.log('Create response status:', createRes.status);
    console.log('Create response data:', createRes.data);
    process.exit(0);
  } catch (err) {
    if (err.response) console.error('Error response:', err.response.status, err.response.data);
    else console.error('Request error:', err.message);
    process.exit(2);
  }
}

run();
