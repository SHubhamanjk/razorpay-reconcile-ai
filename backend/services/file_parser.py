"""CSV parsing and column validation service."""

import io
from typing import Any
import pandas as pd


REQUIRED_COLUMNS = {
    "invoices": ["invoice_id", "invoice_date", "customer", "amount", "reference"],
    "bank_transactions": ["transaction_id", "date", "description", "amount", "reference"],
    "payments": ["payment_id", "date", "customer", "amount", "reference", "status"],
}


class FileParsingError(Exception):
    def __init__(self, message: str, file_name: str, column: str | None = None, details: Any = None):
        super().__init__(message)
        self.message = message
        self.file_name = file_name
        self.column = column
        self.details = details


def parse_csv_content(content: bytes | str, file_name: str, source_type: str) -> pd.DataFrame:
    """
    Parse raw CSV bytes or string into a Pandas DataFrame and validate required columns.
    Raises FileParsingError on invalid CSV format or missing columns.
    """
    if isinstance(content, bytes):
        try:
            stream = io.StringIO(content.decode("utf-8-sig"))
        except UnicodeDecodeError:
            try:
                stream = io.StringIO(content.decode("latin-1"))
            except Exception as e:
                raise FileParsingError(
                    message=f"Failed to decode CSV content: {str(e)}",
                    file_name=file_name
                )
    else:
        stream = io.StringIO(content)

    try:
        df = pd.read_csv(stream, dtype=str, keep_default_na=False)
    except Exception as e:
        raise FileParsingError(
            message=f"Corrupt or invalid CSV format: {str(e)}",
            file_name=file_name
        )

    # Standardize column headers: trim and lowercase
    df.columns = [str(col).strip().lower() for col in df.columns]

    # Validate required columns
    required = REQUIRED_COLUMNS.get(source_type, [])
    for req_col in required:
        if req_col not in df.columns:
            raise FileParsingError(
                message=f"Missing required column: '{req_col}' in {file_name}",
                file_name=file_name,
                column=req_col
            )

    return df
