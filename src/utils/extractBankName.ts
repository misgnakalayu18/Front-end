// utils/extractBankName.ts

export function extractBankName(transaction: any): string | undefined {
  console.log('🔍 extractBankName called for transaction:', transaction.id);
  
  // Handle PARTIAL payments first
  if (transaction.payment_method === 'PARTIAL') {
    console.log('🔍 Processing PARTIAL payment');
    if (transaction.payments?.length) {
      for (const payment of transaction.payments) {
        if (payment.details?.length) {
          // Look for first_payment_bank
          const bankDetail = payment.details.find(
            (d: any) => d.detail_key === 'first_payment_bank'
          );
          if (bankDetail?.detail_value) {
            console.log(`✅ Found first_payment_bank: ${bankDetail.detail_value}`);
            return bankDetail.detail_value;
          }
        }
      }
    }
  }

  // 1 & 2 — scan payment details for both keys
  if (transaction.payments?.length) {
    for (const payment of transaction.payments) {
      if (payment.details?.length) {
        // Try 'bank_name' first, then 'first_payment_bank'
        const bankDetail =
          payment.details.find((d: any) => d.detail_key === 'bank_name') ||
          payment.details.find((d: any) => d.detail_key === 'first_payment_bank');

        if (bankDetail?.detail_value) {
          console.log(`✅ Found bank in payments.details: ${bankDetail.detail_value}`);
          return bankDetail.detail_value;
        }
      }
    }
  }

  // 3 — first split with a bank name
  if (transaction.payment_splits?.length) {
    const splitWithBank = transaction.payment_splits.find(
      (s: any) => s.bank_name && s.bank_name.trim() !== ''
    );
    if (splitWithBank?.bank_name) {
      console.log(`✅ Found bank in payment_splits: ${splitWithBank.bank_name}`);
      return splitWithBank.bank_name;
    }
  }

  // 4 — root-level fallback
  if (transaction.bank_name) {
    console.log(`✅ Found bank at root level: ${transaction.bank_name}`);
    return transaction.bank_name;
  }

  console.log('❌ No bank name found');
  return undefined;
}