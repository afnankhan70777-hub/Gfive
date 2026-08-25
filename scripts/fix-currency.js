const fs = require('fs');
const file = 'src/app/(app)/reports/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace StatCard values
content = content.replace(/value={\`Rs\. \$\{\(financialSummary\.netRevenue \/ 100000\)\.toFixed\(1\)\}L\`}/g, 'value={formatCurrencyCompact(financialSummary.netRevenue, currency)}');
content = content.replace(/value={\`Rs\. \$\{\(totalOutstanding \/ 100000\)\.toFixed\(1\)\}L\`}/g, 'value={formatCurrencyCompact(totalOutstanding, currency)}');

// Replace chart tick formatters
content = content.replace(/tickFormatter={\(v\) =\> \`Rs\.\$\{\(v \/ 1000\)\.toFixed\(0\)\}K\`}/g, "tickFormatter={(v) => formatCurrencyCompact(v, currency).replace(/\\s/g, '')}");
content = content.replace(/tickFormatter={\(v\) =\> \`Rs\.\$\{\(v \/ 100000\)\.toFixed\(0\)\}L\`}/g, "tickFormatter={(v) => formatCurrencyCompact(v, currency).replace(/\\s/g, '')}");

// Replace table cells
content = content.replace(/>Rs\. \$\{\(p\.totalSales \/ 100000\)\.toFixed\(1\)\}L</g, '>{formatCurrencyCompact(p.totalSales, currency)}<');
content = content.replace(/>Rs\. \$\{\(p\.outstanding \/ 100000\)\.toFixed\(1\)\}L</g, '>{formatCurrencyCompact(p.outstanding, currency)}<');

// Replace financial summary cards
content = content.replace(/value: \`Rs\. \$\{\(financialSummary\.totalSales \/ 100000\)\.toFixed\(1\)\}L\`/g, 'value: formatCurrencyCompact(financialSummary.totalSales, currency)');
content = content.replace(/value: \`Rs\. \$\{\(financialSummary\.totalPayments \/ 100000\)\.toFixed\(1\)\}L\`/g, 'value: formatCurrencyCompact(financialSummary.totalPayments, currency)');
content = content.replace(/value: \`Rs\. \$\{\(financialSummary\.totalOutstanding \/ 100000\)\.toFixed\(1\)\}L\`/g, 'value: formatCurrencyCompact(financialSummary.totalOutstanding, currency)');
content = content.replace(/value: \`Rs\. \$\{\(financialSummary\.totalReturnVal \/ 100000\)\.toFixed\(1\)\}L\`/g, 'value: formatCurrencyCompact(financialSummary.totalReturnVal, currency)');

// Replace chart legend names
content = content.replace(/name="Sales \(Rs\.\)"/g, "name={`Sales (${currency})`}");
content = content.replace(/name="Returns \(Rs\.\)"/g, "name={`Returns (${currency})`}");

fs.writeFileSync(file, content);
console.log('Reports page updated');
