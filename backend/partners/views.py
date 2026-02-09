import csv
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from config.settings import MAX_EXPORT_ROWS
from .models import Partner
from .serializers import PartnerSerializer
from partners.services.partner_csv_importer import PartnerCsvImporter, ImportResult, CSV_HEADERS


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
        writer.writerow([CSV_HEADERS])

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

    @action(detail=False, methods=["post"], url_path="import", parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "CSVファイルが指定されていません"}, status=400)

        result = PartnerCsvImporter(request=request).run(file)

        # エラーCSV（HttpResponse）
        if isinstance(result, HttpResponse):
            return result

        # 成功（JSON）
        return Response({"count": result.count}, status=200)