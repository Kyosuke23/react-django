from __future__ import annotations
from dataclasses import dataclass
from typing import Any
from api.base import BaseCsvImporter, RowError
from products.models import Product, ProductCategory
from products.serializers import ProductSerializer, ProductCategorySerializer

# Excelで文字化けしにくい UTF-8 BOM で出したい場合は views 側で utf-8-sig を使う
CSV_HEADERS = [
    "商品コード",
    "商品名称",
    "商品カテゴリ名称",
    "単位",
    "単価",
    "備考",
    "削除済み",
]

def to_csv_row(p) -> list[str]:
    """
    Productインスタンス → CSV 1行分
    """
    category_name = ""
    if getattr(p, "category", None):
        category_name = getattr(p.category, "category_name", "") or getattr(p.category, "name", "") or ""

    return [
        getattr(p, "product_code", "") or "",
        getattr(p, "product_name", "") or "",
        category_name,
        getattr(p, "unit_name", "") or "",
        str(getattr(p, "unit_price", "") or ""),
        getattr(p, "note", "") or "",
        "1" if getattr(p, "is_deleted", False) else "0",
    ]