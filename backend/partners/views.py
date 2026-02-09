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
from .serializers import Serializer
from partners.services.partner_csv_importer import CsvImporter, CSV_HEADERS


class PartnerViewSet(viewsets.ModelViewSet):
    """
    取引先(Partner)のCRUD + CSV入出力を提供する ViewSet。

    - 認可: ログイン済みユーザーのみ (IsAuthenticated)
    - テナント分離: request.user.tenant に属するデータのみを扱う
    - 論理削除: destroy() は物理削除ではなく is_deleted=True にする
    - 追加機能:
        - restore: 論理削除の復元
        - export_csv: CSVエクスポート
        - import_csv: CSVインポート
    """

    # このViewSetが使用するSerializer
    serializer_class = Serializer

    # 認証済みユーザーのみアクセス可能
    permission_classes = [IsAuthenticated]

    # ordering=partner_name などの並び替えクエリを許可する（DRF OrderingFilter）
    filter_backends = [filters.OrderingFilter]

    # クエリパラメータ ordering= で指定できるフィールドのホワイトリスト
    ordering_fields = [
        "partner_name",
        "partner_type",
        "email",
        "tel_number",
        "created_at",
        "updated_at",
    ]

    # ordering 未指定時のデフォルトソート
    ordering = ["partner_name"]

    def get_queryset(self):
        # まずはテナント分離（他テナントのデータを見せない）
        qs = Partner.objects.filter(tenant=self.request.user.tenant)

        # include_deleted=1 のときだけ削除済みも含める
        include_deleted = self.request.query_params.get("include_deleted")
        if include_deleted != "1":
            qs = qs.filter(is_deleted=False)

        # 取引先区分（partner_type）フィルタ
        # 想定外の値は無視（400にはせず、単に絞り込みしない）
        partner_type = (self.request.query_params.get("partner_type") or "").strip()
        if partner_type:
            allowed = {"customer", "supplier", "both"}
            if partner_type in allowed:
                qs = qs.filter(partner_type=partner_type)
            # else: 不正値は無視

        # フリーワード検索（部分一致）
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
        """
        データ登録処理
        """
        serializer.save(
            tenant=self.request.user.tenant,
            create_user=self.request.user,
            update_user=self.request.user,
        )

    def perform_update(self, serializer):
        """
        データ更新処理
        """
        serializer.save(update_user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """
        データ削除処理
        """
        obj = self.get_object()
        obj.is_deleted = True
        obj.update_user = request.user
        obj.save(update_fields=["is_deleted", "update_user", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """
        論理削除されたレコードを復元するアクション。
        """
        # self.get_object() は get_queryset() のフィルタが効いて削除済を拾えないのでNG
        obj = get_object_or_404(Partner.objects.all(), pk=pk)
        obj.is_deleted = False
        obj.update_user = request.user
        obj.save(update_fields=["is_deleted", "update_user", "updated_at"])
        return Response(self.get_serializer(obj).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="export")
    def export_csv(self, request):
        """
        CSV出力処理
        """
        # 件数制限処理
        qs = self.get_queryset()[:MAX_EXPORT_ROWS]

        # CSVレスポンスを組み立て
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="partners.csv"'

        writer = csv.writer(response)

        # 1行目（ヘッダ）
        writer.writerow(CSV_HEADERS)

        # データ行を書き込み
        for p in qs:
            writer.writerow(
                [
                    p.partner_name,
                    p.partner_name_kana or "",
                    p.get_partner_type_display(), # 取引先区分は区分値ではなく日本語を表示
                    p.contact_name or "",
                    p.tel_number or "",
                    p.email,
                    p.postal_code or "",
                    p.state or "",
                    p.city or "",
                    p.address or "",
                    p.address2 or "",
                    "1" if p.is_deleted else "0",
                ]
            )

        return response

    @action(detail=False, methods=["post"], url_path="import", parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        """
        CSVインポート処理
        """
        file = request.FILES.get("file")
        if not file:
            # CSVが指定されていない場合は 400
            return Response({"detail": "CSVファイルが指定されていません"}, status=400)

        # 実処理はサービス層に委譲
        importer = CsvImporter(request=request, file=file)
        return importer.run()