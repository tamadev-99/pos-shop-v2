import fs from 'fs';
import path from 'path';

const dashboardDir = path.join(process.cwd(), 'src/app/(dashboard)');
const dirs = fs.readdirSync(dashboardDir, { withFileTypes: true }).filter(d => d.isDirectory());

for (let d of dirs) {
  const pagePath = path.join(dashboardDir, d.name, 'page.tsx');
  if (fs.existsSync(pagePath)) {
    let content = fs.readFileSync(pagePath, 'utf8');
    
    // Skip if already patched
    if (!content.includes('enforceRouteAccess')) {
      const route = '/' + d.name;
      
      // Match "export default async function Name() {" -> any parameters
      const match = content.match(/(export default async function .*?\([^)]*\)\s*\{)/);
      if (match) {
        content = `import { enforceRouteAccess } from '@/lib/actions/permissions';\n` + content;
        content = content.replace(match[1], `${match[1]}\n  await enforceRouteAccess('${route}');`);
        fs.writeFileSync(pagePath, content);
        console.log(`Patched ${route}`);
      } else if (content.includes('export default function')) {
        console.log(`Skipping ${route} (not async)`);
      }
    } else {
        console.log(`Already patched ${d.name}`);
    }
  }
}
