const fs = require('fs');
const file = 'src/app/(app)/party-ledger/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add currency hook after the data store hooks
content = content.replace(
  /const parties = useDataStore\(\(state\) =\> state\.parties\);\n  const sales = useDataStore\(\(state\) =\> state\.sales\);/,
  'const parties = useDataStore((state) => state.parties);\n  const sales = useDataStore((state) => state.sales);\n  const currency = useSettingsStore((s) => s.settings.currency);'
);

// Replace all Rs. references
content = content.replace(/>Rs\. \$\{\(party\.totalSales \/ 100000\)\.toFixed\(1\)\}L</g, '>{formatCurrencyCompact(party.totalSales, currency)}<');
content = content.replace(/>Rs\. \$\{\(party\.outstanding \/ 100000\)\.toFixed\(1\)\}L due</g, '>{formatCurrencyCompact(party.outstanding, currency)} due<');
content = content.replace(/value: `Rs\. \$\{\(\(selectedParty\?\.totalSales \|\| 0\) \/ 100000\)\.toFixed\(1\)\}L`/g, 'value: formatCurrencyCompact(selectedParty?.totalSales || 0, currency)');
content = content.replace(/value: `Rs\. \$\{\(\(selectedParty\?\.paymentsReceived \|\| 0\) \/ 100000\)\.toFixed\(1\)\}L`/g, 'value: formatCurrencyCompact(selectedParty?.paymentsReceived || 0, currency)');
content = content.replace(/value: `Rs\. \$\{\(\(selectedParty\?\.outstanding \|\| 0\) \/ 100000\)\.toFixed\(1\)\}L`/g, 'value: formatCurrencyCompact(selectedParty?.outstanding || 0, currency)');
content = content.replace(/value: `Rs\. \$\{\(\(selectedParty\?\.returnValue \|\| 0\) \/ 100000\)\.toFixed\(1\)\}L`/g, 'value: formatCurrencyCompact(selectedParty?.returnValue || 0, currency)');
content = content.replace(/value: `Rs\. \$\{\(\(selectedParty\?\.netReceivable \|\| 0\) \/ 100000\)\.toFixed\(1\)\}L`/g, 'value: formatCurrencyCompact(selectedParty?.netReceivable || 0, currency)');
content = content.replace(/value: `Rs\. \$\{\(\(selectedParty\?\.creditLimit \|\| 0\) \/ 100000\)\.toFixed\(1\)\}L`/g, 'value: formatCurrencyCompact(selectedParty?.creditLimit || 0, currency)');
content = content.replace(/\{tx\.type === 'payment' \|\| tx\.type === 'sale' \? '\+' : '-'\}Rs\. \{tx\.amount\.toLocaleString\(\)\}/g, "{tx.type === 'payment' || tx.type === 'sale' ? '+' : '-'}{formatCurrencyCompact(tx.amount, currency)}");
content = content.replace(/>Rs\. \$\{selectedParty\.outstanding\.toLocaleString\(\)\}</g, '>{formatCurrencyCompact(selectedParty.outstanding, currency)}<');
content = content.replace(/Amount \(Rs\.\)/g, 'Amount');

fs.writeFileSync(file, content);
console.log('Party ledger updated');
