from __future__ import annotations
from dataclasses import dataclass
from typing import Any
from api.base import BaseCsvImporter, RowError
from partners.models import Partner
from partners.serializers import Serializer


CSV_HEADERS = [
    "取引先名称", "取引先名称カナ", "区分", "担当者名", "電話番号", "Email",
    "郵便番号", "都道府県", "市区町村", "住所", "建物名等", "削除済み",
]


@dataclass
class PartnerOkRow:
    rowno: int
    row: dict[str, Any]
    key: tuple[str, str]
    validated: dict[str, Any]


class CsvImporter(BaseCsvImporter):
    csv_headers = CSV_HEADERS

    def error_file_prefix(self) -> str:
        return "partners_import_error"

    def init_seen_state(self):
        return set()  # CSV内重複検出

    def normalize_partner_type(self, v: str | None) -> str | None:
        if not v:
            return None
        return Partner.PARTNER_TYPE_MAP.get(v.strip())

    def validate_row(self, *, rowno: int, row: dict[str, Any], seen: set, ) -> list[str]:
        errs: list[str] = []
        tenant = self.request.user.tenant
        partner_name = (row.get("取引先名称") or "").strip()
        email = (row.get("Email") or "").strip()
        pt = self.normalize_partner_type(row.get("区分"))
        if not pt:
            errs.append("区分が不正です（顧客/仕入先/顧客・仕入先 のいずれか）")

        # CSV内重複（取引先名称+Email）
        if partner_name and email:
            key = (partner_name, email)
            if key in seen:
                errs.append("CSV内で同じ取引先名称+Emailが重複しています")
            else:
                seen.add(key)

        serializer = Serializer(
            data={
                "partner_name": row.get("取引先名称"),
                "partner_name_kana": row.get("取引先名称カナ"),
                "partner_type": pt,
                "contact_name": row.get("担当者名"),
                "tel_number": row.get("電話番号"),
                "email": row.get("Email"),
                "postal_code": row.get("郵便番号"),
                "state": row.get("都道府県"),
                "city": row.get("市区町村"),
                "address": row.get("住所"),
                "address2": row.get("建物名等"),
            },
            context={"request": self.request},
        )

        if not serializer.is_valid():
            for k, v in serializer.errors.items():
                if isinstance(v, list):
                    errs.append(f"{k}: " + " / ".join([str(x) for x in v]))
                else:
                    errs.append(f"{k}: {v}")

        # DB重複事前チェック（ユニーク制約）
        if partner_name and email:
            if Partner.objects.filter(tenant=tenant, partner_name=partner_name, email=email).exists():
                errs.append("既に同じ取引先名称+Emailが登録されています")

        return errs

    def build_ok_row(self, *, rowno: int, row: dict[str, Any], seen: set) -> PartnerOkRow:
        pt = self.normalize_partner_type(row.get("区分"))
        serializer = Serializer(
            data={
                "partner_name": row.get("取引先名称"),
                "partner_name_kana": row.get("取引先名称カナ"),
                "partner_type": pt,
                "contact_name": row.get("担当者名"),
                "tel_number": row.get("電話番号"),
                "email": row.get("Email"),
                "postal_code": row.get("郵便番号"),
                "state": row.get("都道府県"),
                "city": row.get("市区町村"),
                "address": row.get("住所"),
                "address2": row.get("建物名等"),
            },
            context={"request": self.request},
        )
        serializer.is_valid(raise_exception=True)

        partner_name = (row.get("取引先名称") or "").strip()
        email = (row.get("Email") or "").strip()
        return PartnerOkRow(rowno=rowno, row=row, key=(partner_name, email), validated=serializer.validated_data)

    def save_ok_rows(self, ok_rows: list[PartnerOkRow]) -> int:
        tenant = self.request.user.tenant
        user = self.request.user

        objs = [
            Partner(
                tenant=tenant,
                create_user=user,
                update_user=user,
                **r.validated,
            )
            for r in ok_rows
        ]
        Partner.objects.bulk_create(objs)
        return len(objs)

    def on_integrity_error(self, ok_rows: list[PartnerOkRow]) -> list[RowError]:
        tenant = self.request.user.tenant
        conflicts: list[RowError] = []
        for r in ok_rows:
            pn, em = r.key
            if pn and em and Partner.objects.filter(tenant=tenant, partner_name=pn, email=em).exists():
                conflicts.append(
                    RowError(
                        rowno=r.rowno,
                        row=r.row,
                        errors=["同時更新により重複が発生しました（既に同じ取引先名称+Emailが登録されています）"],
                    )
                )
        return conflicts