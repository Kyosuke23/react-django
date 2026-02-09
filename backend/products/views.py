from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Product, ProductCategory
from .serializers import ProductSerializer, ProductCategorySerializer


class ProductCategoryViewSet(viewsets.ModelViewSet):
    """
    商品カテゴリマスタ（補助CRUD）
    - tenantスコープ
    - 論理削除 + restore
    - q 検索（カテゴリ名）
    - ordering 対応
    """
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["product_category_name", "created_at", "updated_at"]
    ordering = ["product_category_name"]

    def get_queryset(self):
        qs = ProductCategory.objects.filter(tenant=self.request.user.tenant)

        include_deleted = self.request.query_params.get("include_deleted")
        if include_deleted != "1":
            qs = qs.filter(is_deleted=False)

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(Q(product_category_name__icontains=q))
        return qs

    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            create_user=self.request.user,
            update_user=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(update_user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.is_deleted = True
        obj.update_user = request.user
        obj.save(update_fields=["is_deleted", "update_user", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        obj = get_object_or_404(ProductCategory.objects.all(), pk=pk)
        # tenant越え防止（念のため）
        if obj.tenant_id != request.user.tenant_id:
            return Response(status=status.HTTP_404_NOT_FOUND)

        obj.is_deleted = False
        obj.update_user = request.user
        obj.save(update_fields=["is_deleted", "update_user", "updated_at"])
        return Response(self.get_serializer(obj).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="choices")
    def choices(self, request):
        """
        商品フォームの<select>用に、削除済みを除いた簡易一覧を返す。
        例: [{id: 1, product_category_name: "食品"}, ...]
        """
        qs = ProductCategory.objects.filter(
            tenant=request.user.tenant,
            is_deleted=False,
        ).order_by("product_category_name")

        data = [{"id": c.id, "product_category_name": c.product_category_name} for c in qs]
        return Response(data, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    """
    商品マスタ（メインCRUD）
    - tenantスコープ
    - 論理削除 + restore
    - q 検索（コード/名称/カナ/備考）
    - category フィルタ
    - ordering 対応
    """
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = [
        "id",
        "product_name",
        "unit_price",
        "created_at",
        "updated_at",
    ]
    ordering = ["id"]

    def get_queryset(self):
        qs = Product.objects.filter(tenant=self.request.user.tenant)

        include_deleted = self.request.query_params.get("include_deleted")
        if include_deleted != "1":
            qs = qs.filter(is_deleted=False)

        # category フィルタ（product_category_id）
        category_id = (self.request.query_params.get("product_category") or "").strip()
        if category_id:
            # int変換できない不正値は無視
            try:
                qs = qs.filter(product_category_id=int(category_id))
            except ValueError:
                pass

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(
                Q(product_name__icontains=q)
                | Q(description__icontains=q)
            )

        return qs.select_related("product_category")

    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            create_user=self.request.user,
            update_user=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(update_user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.is_deleted = True
        obj.update_user = request.user
        obj.save(update_fields=["is_deleted", "update_user", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        obj = get_object_or_404(Product.objects.all(), pk=pk)
        if obj.tenant_id != request.user.tenant_id:
            return Response(status=status.HTTP_404_NOT_FOUND)

        obj.is_deleted = False
        obj.update_user = request.user
        obj.save(update_fields=["is_deleted", "update_user", "updated_at"])
        return Response(self.get_serializer(obj).data, status=status.HTTP_200_OK)