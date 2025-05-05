const fs = require('fs');
const path = require('path');

// Chart components to update
const chartComponents = [
  'WaterfallChart.tsx',
  'Histogram.tsx',
  'PerfBonusScatter.tsx',
  'DeptStackedBar.tsx',
  'PayrollSunburst.tsx',
  'FlagsHeatmap.tsx',
  'SensitivityCurve.tsx'
];

// Path to charts directory
const chartsDir = path.join(__dirname, 'src', 'charts');

// Update each chart component
chartComponents.forEach(file => {
  const filePath = path.join(chartsDir, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace any incorrect import paths with the correct one
    content = content.replace(
      /import\s*{\s*useScenario\s*}\s*from\s*['"].*['"]/g,
      `import { useScenario } from '../SimpleContext'`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Import paths updated successfully!');
