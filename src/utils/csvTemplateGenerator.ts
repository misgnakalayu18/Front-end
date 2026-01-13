// utils/csvTemplateGenerator.ts
export const generateCSVTemplate = (): string => {
  const headers = [
    'code',
    'productName', 
    'warehouse',
    'unit',
    'qty',
    'ctn', 
    'price',
    'totalPrice',
    'remark'
  ].join(',');

  const sampleData = [
    ['EK-001', '1034 AIR FRYER SONIFER', 'SHEGOLE_MULUNEH', 'PC', '2', '29', '11000', '638000', ''],
    ['EK-002', 'AVOCADO COFFEE GRINDER', 'EMBILTA', 'PC', '24', '26', '1350', '842400', ''],
    ['EK-003', 'MEET 22', 'NEW_SHEGOLE', 'PC', '1', '24', '40000', '960000', 'New arrival'],
    ['EK-004', 'MEET 12', 'MERKATO', 'PC', '1', '189', '22000', '4158000', ''],
    ['EK-005', 'MEET 32', 'DAMAGE', 'PC', '1', '17', '55000', '935000', 'Damaged item'],
    ['EK-006', 'COFFEE 100 GM', 'BACKUP', 'PC', '8', '120', '2800', '2688000', 'Backup stock'],
  ].map(row => row.join(',')).join('\n');

  return `${headers}\n${sampleData}`;
};