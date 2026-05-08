import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const tokenMatch = envFile.match(/VITE_NEON_DATA_API_TOKEN=(.*)/);
const token = tokenMatch ? tokenMatch[1].trim() : null;

if (!token) {
  console.error("Token not found");
  process.exit(1);
}

const url = 'https://ep-ancient-tooth-amjyc3yp.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1/';

fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
  .then(res => res.json())
  .then(data => {
    if (data.paths) {
      const paths = Object.keys(data.paths);
      console.log(paths.filter(p => p !== '/').map(p => p.substring(1)).join('\n'));
    } else {
      console.log('Error:', data);
    }
  })
  .catch(console.error);
