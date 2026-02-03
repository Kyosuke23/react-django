from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Tenant
from .serializers import TenantSerializer

class TenantViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSerializer

    def get_queryset(self):
        qs = Tenant.objects.all().order_by("tenant_code")

        include_deleted = self.request.query_params.get("include_deleted", "0")
        if include_deleted != "1":
            qs = qs.filter(is_deleted=False)

        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(tenant_name__icontains=q) |
                Q(representative_name__icontains=q) |
                Q(email__icontains=q) |
                Q(tel_number__icontains=q)
            )
        return qs

    def perform_create(self, serializer):
        # 必要なら create_user / update_user をセット
        serializer.save(create_user=self.request.user, update_user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(update_user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        # 論理削除
        obj = self.get_object()
        obj.is_deleted = True
        obj.update_user = request.user
        obj.save(update_fields=["is_deleted", "update_user", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        obj = self.get_object()
        obj.is_deleted = False
        obj.update_user = request.user
        obj.save(update_fields=["is_deleted", "update_user", "updated_at"])
        return Response(self.get_serializer(obj).data)