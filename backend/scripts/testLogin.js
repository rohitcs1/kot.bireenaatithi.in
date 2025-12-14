const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:4000/api/auth/superadmin/login', {
      email: 'rohitcs175@gmail.com',
      password: 'Kali@8320191025'
    }, { timeout: 5000 });
    console.log('Status:', res.status);
    console.log('Body:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Response error:', err.response.status, err.response.data);
    } else {
      console.error('Request failed:', err.message);
    }
    process.exit(1);
  }
}

test();
