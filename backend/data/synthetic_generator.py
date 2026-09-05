"""Synthetic dataset generator for financial 3-way reconciliation benchmark."""

import random
from datetime import date, timedelta
from typing import Any
import pandas as pd


SAMPLE_COMPANIES = [
    ("ABC Pvt Ltd", "ABC PRIVATE LIMITED", "ABC PVT. LTD."),
    ("XYZ Technologies Ltd", "XYZ TECHNOLOGIES LIMITED", "XYZ Tech Ltd"),
    ("Global Enterprise Solutions", "GLOBAL ENTERPRISE SOLS", "Global Enterprise Solutions Inc"),
    ("Acme Trading Corp", "ACME TRADING CORPORATION", "Acme Trading Co"),
    ("Nexus Retail Services LLP", "NEXUS RETAIL SERVICES", "Nexus Retail"),
    ("Apex Logistics Ltd", "APEX LOGISTICS LIMITED", "Apex Logistics"),
    ("Prime Infotech Solutions", "PRIME INFOTECH SOLS", "Prime Infotech"),
    ("Zenith Health Systems", "ZENITH HEALTH SYSTEMS INC", "Zenith Health"),
    ("Vanguard Manufacturing", "VANGUARD MFG PVT LTD", "Vanguard Mfg"),
    ("Horizon Media Works", "HORIZON MEDIA WORKS CORP", "Horizon Media"),
]


def generate_synthetic_dataset(
    count: int = 500,
    seed: int = 42,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, list[dict[str, Any]]]:
    """
    Generate synthetic data for Invoices, Payments, and Bank Transactions.
    Includes intentional edge cases:
    - ~70% Exact Reference / High Confidence Reconciled
    - ~10% Fuzzy Name Variations
    - ~5% Amount Mismatches (bank fee / partial payment)
    - ~5% Missing Payments
    - ~5% Missing Bank Transactions
    - ~5% Duplicates
    
    Returns:
    - invoices_df
    - payments_df
    - bank_df
    - ground_truth: list of dicts with expected reconciliation status and targets
    """
    rng = random.Random(seed)
    base_date = date(2026, 8, 1)

    invoices = []
    payments = []
    bank_txs = []
    ground_truth = []

    for i in range(1, count + 1):
        inv_id = f"INV{i:04d}"
        pay_id = f"PAY{i:04d}"
        tx_id = f"TX{i:04d}"
        ref = f"REF{i:04d}"

        company_tuple = rng.choice(SAMPLE_COMPANIES)
        inv_company = company_tuple[0]
        pay_company = company_tuple[1] if rng.random() > 0.3 else company_tuple[0]
        bank_desc = f"{company_tuple[1]} SETTLEMENT"

        # Amount between 1,000 and 100,000
        amount = round(rng.uniform(1000.0, 100000.0), 2)
        inv_date = base_date + timedelta(days=rng.randint(0, 20))
        pay_date = inv_date + timedelta(days=rng.randint(0, 2))
        bank_date = pay_date + timedelta(days=rng.randint(1, 3))

        case_roll = rng.random()

        if case_roll < 0.70:
            # Case 1: Reconciled (clean / normal flow)
            invoices.append({
                "invoice_id": inv_id,
                "invoice_date": inv_date.isoformat(),
                "customer": inv_company,
                "amount": f"{amount:.2f}",
                "reference": ref,
            })
            payments.append({
                "payment_id": pay_id,
                "date": pay_date.isoformat(),
                "customer": pay_company,
                "amount": f"{amount:.2f}",
                "reference": ref,
                "status": "settled",
            })
            bank_txs.append({
                "transaction_id": tx_id,
                "date": bank_date.isoformat(),
                "description": bank_desc,
                "amount": f"{amount:.2f}",
                "reference": ref,
            })
            ground_truth.append({
                "invoice_id": inv_id,
                "expected_status": "RECONCILED",
                "expected_payment_id": pay_id,
                "expected_transaction_id": tx_id,
            })

        elif case_roll < 0.80:
            # Case 2: Fuzzy Name / Reference Missing on Payment or Bank
            invoices.append({
                "invoice_id": inv_id,
                "invoice_date": inv_date.isoformat(),
                "customer": inv_company,
                "amount": f"{amount:.2f}",
                "reference": ref,
            })
            payments.append({
                "payment_id": pay_id,
                "date": pay_date.isoformat(),
                "customer": company_tuple[2],
                "amount": f"{amount:.2f}",
                "reference": "",  # missing reference
                "status": "settled",
            })
            bank_txs.append({
                "transaction_id": tx_id,
                "date": bank_date.isoformat(),
                "description": bank_desc,
                "amount": f"{amount:.2f}",
                "reference": ref,
            })
            ground_truth.append({
                "invoice_id": inv_id,
                "expected_status": "RECONCILED",
                "expected_payment_id": pay_id,
                "expected_transaction_id": tx_id,
            })

        elif case_roll < 0.86:
            # Case 3: Amount Mismatch (e.g. ₹500 fee deduction on bank settlement)
            bank_amount = round(amount - 500.0, 2)
            invoices.append({
                "invoice_id": inv_id,
                "invoice_date": inv_date.isoformat(),
                "customer": inv_company,
                "amount": f"{amount:.2f}",
                "reference": ref,
            })
            payments.append({
                "payment_id": pay_id,
                "date": pay_date.isoformat(),
                "customer": pay_company,
                "amount": f"{amount:.2f}",
                "reference": ref,
                "status": "settled",
            })
            bank_txs.append({
                "transaction_id": tx_id,
                "date": bank_date.isoformat(),
                "description": bank_desc,
                "amount": f"{bank_amount:.2f}",
                "reference": ref,
            })
            ground_truth.append({
                "invoice_id": inv_id,
                "expected_status": "AMOUNT_MISMATCH",
                "expected_payment_id": pay_id,
                "expected_transaction_id": tx_id,
            })

        elif case_roll < 0.91:
            # Case 4: Missing Payment
            invoices.append({
                "invoice_id": inv_id,
                "invoice_date": inv_date.isoformat(),
                "customer": inv_company,
                "amount": f"{amount:.2f}",
                "reference": ref,
            })
            bank_txs.append({
                "transaction_id": tx_id,
                "date": bank_date.isoformat(),
                "description": bank_desc,
                "amount": f"{amount:.2f}",
                "reference": ref,
            })
            ground_truth.append({
                "invoice_id": inv_id,
                "expected_status": "MISSING_PAYMENT",
                "expected_payment_id": None,
                "expected_transaction_id": tx_id,
            })

        elif case_roll < 0.96:
            # Case 5: Missing Bank Transaction
            invoices.append({
                "invoice_id": inv_id,
                "invoice_date": inv_date.isoformat(),
                "customer": inv_company,
                "amount": f"{amount:.2f}",
                "reference": ref,
            })
            payments.append({
                "payment_id": pay_id,
                "date": pay_date.isoformat(),
                "customer": pay_company,
                "amount": f"{amount:.2f}",
                "reference": ref,
                "status": "settled",
            })
            ground_truth.append({
                "invoice_id": inv_id,
                "expected_status": "MISSING_BANK_TRANSACTION",
                "expected_payment_id": pay_id,
                "expected_transaction_id": None,
            })

        else:
            # Case 6: Duplicate Reference / Records
            invoices.append({
                "invoice_id": inv_id,
                "invoice_date": inv_date.isoformat(),
                "customer": inv_company,
                "amount": f"{amount:.2f}",
                "reference": "REF_DUP_COMMON",
            })
            payments.append({
                "payment_id": pay_id,
                "date": pay_date.isoformat(),
                "customer": pay_company,
                "amount": f"{amount:.2f}",
                "reference": "REF_DUP_COMMON",
                "status": "settled",
            })
            bank_txs.append({
                "transaction_id": tx_id,
                "date": bank_date.isoformat(),
                "description": bank_desc,
                "amount": f"{amount:.2f}",
                "reference": "REF_DUP_COMMON",
            })
            ground_truth.append({
                "invoice_id": inv_id,
                "expected_status": "DUPLICATE",
                "expected_payment_id": pay_id,
                "expected_transaction_id": tx_id,
            })

    inv_df = pd.DataFrame(invoices)
    pay_df = pd.DataFrame(payments)
    bnk_df = pd.DataFrame(bank_txs)

    return inv_df, pay_df, bnk_df, ground_truth


def save_dataset_to_csv(
    output_dir: str = "data/sample",
    count: int = 500,
    seed: int = 42,
) -> dict[str, str]:
    """
    Generate synthetic data and save to CSV files and JSON ground truth on disk.
    """
    import os
    import json

    os.makedirs(output_dir, exist_ok=True)

    inv_df, pay_df, bnk_df, ground_truth = generate_synthetic_dataset(count=count, seed=seed)

    inv_path = os.path.join(output_dir, "invoices.csv")
    pay_path = os.path.join(output_dir, "payments.csv")
    bnk_path = os.path.join(output_dir, "bank_transactions.csv")
    gt_path = os.path.join(output_dir, "ground_truth.json")

    inv_df.to_csv(inv_path, index=False)
    pay_df.to_csv(pay_path, index=False)
    bnk_df.to_csv(bnk_path, index=False)

    with open(gt_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, indent=2)

    return {
        "invoices": os.path.abspath(inv_path),
        "payments": os.path.abspath(pay_path),
        "bank_transactions": os.path.abspath(bnk_path),
        "ground_truth": os.path.abspath(gt_path),
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate synthetic financial reconciliation dataset.")
    parser.add_argument("--count", type=int, default=500, help="Number of invoice records (default: 500)")
    parser.add_argument("--output-dir", type=str, default="data/sample", help="Output directory (default: data/sample)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed (default: 42)")

    args = parser.parse_args()

    print(f"\n⚡ Generating {args.count} synthetic records (seed={args.seed})...")
    saved_files = save_dataset_to_csv(output_dir=args.output_dir, count=args.count, seed=args.seed)

    print("\n✅ Successfully generated and saved dataset files:")
    for key, path in saved_files.items():
        print(f"  📄 {key.upper()}: {path}")
    print(f"\n📂 Output directory: {args.output_dir}\n")

