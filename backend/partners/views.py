import csv
from datetime import datetime
from io import StringIO
from django.db import IntegrityError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from config.settings import MAX_EXPORT_ROWS
from .models import Partner
from .serializers import PartnerSerializer

PARTNER_TYPE_MAP = {
    "顧客": "customer",
    "仕入先": "supplier",
    "顧客・仕入先": "both",
}

CSV_HEADERS = [
    "取引先名称", "取引先名称カナ", "区分", "担当者名", "電話番号", "Email",
    "郵便番号", "都道府県", "市区町村", "住所", "建物名等", "削除済み",
]

ERROR_COL = "エラー内容"
ROWNO_COL = "行番号"

class PartnerViewSet(viewsets.ModelViewSet):
    serializer_class = PartnerSerializer
    permission_classes = [IsAuthenticated]

    # ordering=partner_name などを許可
    filter_backends = [filters.OrderingFilter]
    ordering_fields = [
        "partner_name",
        "partner_type",
        "email",
        "tel_number",
        "created_at",
        "updated_at",
    ]
    ordering = ["partner_name"]

    def get_queryset(self):
        qs = Partner.objects.filter(tenant=self.request.user.tenant)

        include_deleted = self.request.query_params.get("include_deleted")
        if include_deleted != "1":
            qs = qs.filter(is_deleted=False)

        # 取引先区分（partner_type）フィルタ追加
        partner_type = (self.request.query_params.get("partner_type") or "").strip()
        if partner_type:
            allowed = {"customer", "supplier", "both"}
            if partner_type in allowed:
                qs = qs.filter(partner_type=partner_type)
            # else: 不正値は無視

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(
                Q(partner_name__icontains=q)
                | Q(partner_name_kana__icontains=q)
                | Q(contact_name__icontains=q)
                | Q(email__icontains=q)
                | Q(tel_number__icontains=q)
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            create_user=self.request.user,
            update_user=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(update_user=self.request.user)

    # DELETE = 物理削除ではなく論理削除にする
    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.is_deleted = True
        obj.update_user = request.user
        obj.save(update_fields=["is_deleted", "update_user", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        # self.get_object() は get_queryset() のフィルタが効いて削除済を拾えないのでNG
        obj = get_object_or_404(Partner.objects.all(), pk=pk)
        obj.is_deleted = False
        obj.update_user = request.user
        obj.save(update_fields=["is_deleted", "update_user", "updated_at"])
        return Response(self.get_serializer(obj).data, status=status.HTTP_200_OK)


    @action(detail=False, methods=["get"], url_path="export")
    def export_csv(self, request):
        qs = self.get_queryset()[:MAX_EXPORT_ROWS]

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="partners.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "取引先名称", "取引先名称カナ", "区分", "担当者名", "電話番号", "Email",
            "郵便番号", "都道府県", "市区町村", "住所", "建物名等", "削除済み",
        ])

        for p in qs:
            writer.writerow([
                p.partner_name,
                p.partner_name_kana or "",
                p.get_partner_type_display(),
                p.contact_name or "",
                p.tel_number or "",
                p.email,
                p.postal_code or "",
                p.state or "",
                p.city or "",
                p.address or "",
                p.address2 or "",
                "1" if p.is_deleted else "0",
            ])

        return response

    @staticmethod
    def normalize_partner_type(value: str | None) -> str | None:
        if not value:
            return None
        return PARTNER_TYPE_MAP.get(value.strip())

    def _error_csv_response(self, error_rows: list[dict], filename: str) -> HttpResponse:
        """
        error_rows: CSVの1行分 dict に、ROWNO_COL, ERROR_COL を付加したもの
        """
        res = HttpResponse(content_type="text/csv; charset=utf-8")
        res["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.DictWriter(
            res,
            fieldnames=[ROWNO_COL] + CSV_HEADERS + [ERROR_COL],
            extrasaction="ignore",
        )
        writer.writeheader()

        for r in error_rows:
            # 欠けても空文字で埋める（開いた時に見やすい）
            out = {h: (r.get(h) or "") for h in CSV_HEADERS}
            out[ROWNO_COL] = r.get(ROWNO_COL, "")
            out[ERROR_COL] = r.get(ERROR_COL, "")
            writer.writerow(out)

        return res

    @staticmethod
    def now_ymdhms():
        return datetime.now().strftime("%Y%m%d%H%M%S")

    def _error_csv_response(self, error_rows: list[dict], filename: str) -> HttpResponse:
        """
        error_rows: [{row: dict, errors: [msg,...], rowno: int}, ...]
        """
        sio = StringIO()
        writer = csv.writer(sio)

        # BOM付きUTF-8（Excel向け）
        writer.writerow(["行番号", *CSV_HEADERS, "エラー"])

        for er in error_rows:
            row = er["row"]
            rowno = er["rowno"]
            reason = " / ".join(er["errors"])

            writer.writerow([
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
            ])

        body = ("\ufeff" + sio.getvalue()).encode("utf-8")
        resp = HttpResponse(body, content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[MultiPartParser, FormParser],
    )
    def import_csv(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "CSVファイルが指定されていません"}, status=400)

        decoded = file.read().decode("utf-8-sig").splitlines()
        reader = csv.DictReader(decoded)

        error_rows: list[dict] = []
        validated_rows: list[dict] = []

        seen_keys: set[tuple[str, str]] = set()  # CSV内重複: (partner_name, email)

        for rowno, row in enumerate(reader, start=2):
            row_errors: list[str] = []

            partner_name = (row.get("取引先名称") or "").strip()
            email = (row.get("Email") or "").strip()

            # 区分（日本語のみ）
            pt = self.normalize_partner_type(row.get("区分"))
            if not pt:
                row_errors.append("区分が不正です（顧客/仕入先/顧客・仕入先 のいずれか）")

            # CSV内重複
            if partner_name and email:
                key = (partner_name, email)
                if key in seen_keys:
                    row_errors.append("CSV内で同じ取引先名+Emailが重複しています")
                else:
                    seen_keys.add(key)

            serializer = PartnerSerializer(
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
                context={"request": request},
            )

            if not serializer.is_valid():
                for k, v in serializer.errors.items():
                    msg = " / ".join([str(x) for x in v]) if isinstance(v, list) else str(v)
                    row_errors.append(f"{k}: {msg}")

            # ★DB重複（ユニーク制約）事前チェック
            if partner_name and email:
                if Partner.objects.filter(
                    tenant=request.user.tenant,
                    partner_name=partner_name,
                    email=email,
                ).exists():
                    row_errors.append("既に同じ取引先名+Emailが登録されています")

            if row_errors:
                error_rows.append({"rowno": rowno, "row": row, "errors": row_errors})
                continue

            validated_rows.append(serializer.validated_data)

        # 1件でもエラー → 保存せず、エラー行だけCSV返却（200 + text/csv）
        if error_rows:
            fn = f"partners_import_errors_{self.now_ymdhms()}.csv"
            return self._error_csv_response(error_rows, fn)

        # 全行OK → atomic + bulk_create
        try:
            with transaction.atomic():
                objs = [
                    Partner(
                        tenant=request.user.tenant,
                        create_user=request.user,
                        update_user=request.user,
                        **vd,
                    )
                    for vd in validated_rows
                ]
                Partner.objects.bulk_create(objs)
        except IntegrityError:
            # 競合などのレアケース
            fn = f"partners_import_errors_{self.now_ymdhms()}.csv"
            return self._error_csv_response(
                [{"rowno": 0, "row": {}, "errors": ["同時更新により重複が発生しました。再度CSV取込を実行してください。"]}],
                fn,
            )

        return Response({"count": len(validated_rows)}, status=200)