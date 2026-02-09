import csv
from dataclasses import dataclass
from datetime import datetime
from io import StringIO
from typing import Any
from django.db import IntegrityError, transaction
from django.http import HttpResponse
from rest_framework.request import Request
from partners.models import Partner
from partners.serializers import PartnerSerializer


CSV_HEADERS = [
    "取引先名称",
    "取引先名称カナ",
    "区分",
    "担当者名",
    "電話番号",
    "Email",
    "郵便番号",
    "都道府県",
    "市区町村",
    "住所",
    "建物名等",
    "削除済み",
]


@dataclass(frozen=True)
class ImportResult:
    count: int


class PartnerCsvImporter:
    """
    - 全行正常のときのみ保存（Atomic）
    - エラーがあれば「エラー行だけ」のCSVを返す（200 + text/csv）
    - 区分は日本語（顧客/仕入先/顧客・仕入先）のみ許可
    - CSV内重複、DB既存重複、競合(IntegrityError)もエラーCSVで返す
    """

    def __init__(self, *, request: Request):
        self.request = request
        self.user = request.user
        self.tenant = request.user.tenant

    # -----------------------------
    # public API
    # -----------------------------
    def run(self, file) -> ImportResult | HttpResponse:
        """
        成功: ImportResult(count=n)
        失敗: HttpResponse(text/csv)  ※ステータス200のまま（フロントは content-type で判定）
        """
        rows = self._read_csv(file)

        error_rows: list[dict[str, Any]] = []
        ok_rows: list[dict[str, Any]] = []

        # CSV内重複検出（取引先名称 + Email）
        seen: set[tuple[str, str]] = set()

        for rowno, row in rows:
            row_errors: list[str] = []

            partner_name = (row.get("取引先名称") or "").strip()
            email = (row.get("Email") or "").strip()

            # 区分（日本語のみ許可）
            pt = self.normalize_partner_type(row.get("区分"))
            if not pt:
                row_errors.append("区分が不正です（顧客/仕入先/顧客・仕入先 のいずれか）")

            # CSV内重複
            if partner_name and email:
                key = (partner_name, email)
                if key in seen:
                    row_errors.append("CSV内で同じ取引先名称+Emailが重複しています")
                else:
                    seen.add(key)

            serializer = PartnerSerializer(
                data=self._to_serializer_data(row, pt),
                context={"request": self.request},
            )

            if not serializer.is_valid():
                row_errors.extend(self._format_serializer_errors(serializer.errors))

            # DB重複（既存）事前チェック
            if partner_name and email:
                if Partner.objects.filter(
                    tenant=self.tenant,
                    partner_name=partner_name,
                    email=email,
                ).exists():
                    row_errors.append("既に同じ取引先名称+Emailが登録されています")

            if row_errors:
                error_rows.append({"rowno": rowno, "row": row, "errors": row_errors})
                continue

            ok_rows.append(
                {
                    "rowno": rowno,
                    "row": row,
                    "key": (partner_name, email),
                    "validated": serializer.validated_data,
                }
            )

        # 1つでもエラーがあれば保存せずにエラーCSV（200 + text/csv）
        if error_rows:
            return self._error_csv_response(
                error_rows=error_rows,
                filename=f"partners_import_errors_{self.now_ymdhms()}.csv",
            )

        # 全行OK → atomic + bulk_create
        try:
            with transaction.atomic():
                objs = [
                    Partner(
                        tenant=self.tenant,
                        create_user=self.user,
                        update_user=self.user,
                        **r["validated"],
                    )
                    for r in ok_rows
                ]
                Partner.objects.bulk_create(objs)
        except IntegrityError:
            # 競合等で重複が発生した可能性があるので、どの行がダメか再チェックしてエラーCSV
            conflict_rows: list[dict[str, Any]] = []
            for r in ok_rows:
                partner_name, email = r["key"]
                if partner_name and email and Partner.objects.filter(
                    tenant=self.tenant, partner_name=partner_name, email=email
                ).exists():
                    conflict_rows.append(
                        {
                            "rowno": r["rowno"],
                            "row": r["row"],
                            "errors": [
                                "同時更新により重複が発生しました（既に同じ取引先名称+Emailが登録されています）"
                            ],
                        }
                    )

            if not conflict_rows:
                conflict_rows = [
                    {
                        "rowno": 0,
                        "row": {},
                        "errors": ["DB登録時に整合性エラーが発生しました。CSVを見直して再実行してください。"],
                    }
                ]

            return self._error_csv_response(
                error_rows=conflict_rows,
                filename=f"partners_import_errors_{self.now_ymdhms()}.csv",
            )

        return ImportResult(count=len(ok_rows))

    # -----------------------------
    # helpers
    # -----------------------------
    @staticmethod
    def normalize_partner_type(value: str | None) -> str | None:
        if not value:
            return None
        return Partner.PARTNER_TYPE_MAP.get(value.strip())

    @staticmethod
    def now_ymdhms() -> str:
        return datetime.now().strftime("%Y%m%d%H%M%S")

    def _read_csv(self, file) -> list[tuple[int, dict[str, str]]]:
        decoded = file.read().decode("utf-8-sig").splitlines()
        reader = csv.DictReader(decoded)
        return list(enumerate(reader, start=2))  # ヘッダ=1行目

    def _to_serializer_data(self, row: dict[str, str], pt: str | None) -> dict[str, Any]:
        # serializerで必須/形式を拾う前提。ここでは生値をそのまま渡す
        return {
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
        }

    def _format_serializer_errors(self, errors: Any) -> list[str]:
        # {field: [msg,...]} を "field: msg / msg" に整形
        out: list[str] = []
        if isinstance(errors, dict):
            for k, v in errors.items():
                if isinstance(v, list):
                    out.append(f"{k}: " + " / ".join([str(x) for x in v]))
                else:
                    out.append(f"{k}: {v}")
        else:
            out.append(str(errors))
        return out

    def _error_csv_response(self, *, error_rows: list[dict[str, Any]], filename: str) -> HttpResponse:
        """
        エラー行だけCSV（Excel向けにUTF-8 BOM）
        - columns: 行番号 + 元ヘッダ(そのまま) + エラー内容
        """
        sio = StringIO()
        writer = csv.writer(sio)

        writer.writerow(["行番号", *CSV_HEADERS, "エラー内容"])

        for er in error_rows:
            row = er.get("row") or {}
            rowno = er.get("rowno") or ""
            reason = " / ".join([str(x) for x in (er.get("errors") or [])])

            writer.writerow(
                [
                    rowno,
                    (row.get("取引先名称") or ""),
                    (row.get("取引先名称カナ") or ""),
                    (row.get("区分") or ""),
                    (row.get("担当者名") or ""),
                    (row.get("電話番号") or ""),
                    (row.get("Email") or ""),
                    (row.get("郵便番号") or ""),
                    (row.get("都道府県") or ""),
                    (row.get("市区町村") or ""),
                    (row.get("住所") or ""),
                    (row.get("建物名等") or ""),
                    (row.get("削除済み") or ""),
                    reason,
                ]
            )

        body = ("\ufeff" + sio.getvalue()).encode("utf-8")
        resp = HttpResponse(body, content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp