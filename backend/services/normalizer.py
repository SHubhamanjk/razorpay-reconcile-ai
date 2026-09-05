"""Data normalization service for Invoices, Payments, and Bank Transactions."""

import pandas as pd
from utils.text import normalize_name, normalize_reference, normalize_text
from utils.amounts import normalize_amount
from utils.dates import normalize_date


def normalize_invoices(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize invoice dataframe without mutating original raw columns.
    Creates normalized fields:
    - invoice_id_clean
    - customer_normalized
    - reference_normalized
    - amount_normalized
    - date_normalized
    """
    norm_df = df.copy()
    norm_df["invoice_id_clean"] = norm_df["invoice_id"].astype(str).str.strip()
    norm_df["customer_normalized"] = norm_df["customer"].apply(normalize_name)
    norm_df["reference_normalized"] = norm_df["reference"].apply(normalize_reference)
    norm_df["amount_normalized"] = norm_df["amount"].apply(normalize_amount)
    norm_df["date_normalized"] = norm_df["invoice_date"].apply(normalize_date)
    return norm_df


def normalize_payments(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize payments dataframe without mutating original raw columns.
    Creates normalized fields:
    - payment_id_clean
    - customer_normalized
    - reference_normalized
    - amount_normalized
    - date_normalized
    - status_clean
    """
    norm_df = df.copy()
    norm_df["payment_id_clean"] = norm_df["payment_id"].astype(str).str.strip()
    norm_df["customer_normalized"] = norm_df["customer"].apply(normalize_name)
    norm_df["reference_normalized"] = norm_df["reference"].apply(normalize_reference)
    norm_df["amount_normalized"] = norm_df["amount"].apply(normalize_amount)
    norm_df["date_normalized"] = norm_df["date"].apply(normalize_date)
    norm_df["status_clean"] = norm_df["status"].astype(str).str.strip().str.lower()
    return norm_df


def normalize_bank_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize bank transactions dataframe without mutating original raw columns.
    Creates normalized fields:
    - transaction_id_clean
    - customer_normalized (derived from description)
    - reference_normalized
    - amount_normalized
    - date_normalized
    """
    norm_df = df.copy()
    norm_df["transaction_id_clean"] = norm_df["transaction_id"].astype(str).str.strip()
    # In bank records, description usually contains the customer/party name
    norm_df["customer_normalized"] = norm_df["description"].apply(normalize_name)
    norm_df["reference_normalized"] = norm_df["reference"].apply(normalize_reference)
    norm_df["amount_normalized"] = norm_df["amount"].apply(normalize_amount)
    norm_df["date_normalized"] = norm_df["date"].apply(normalize_date)
    return norm_df
