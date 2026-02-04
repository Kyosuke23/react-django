from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Partner
from .serializers import PartnerSerializer

class PartnerViewSet(viewsets.ModelViewSet):
    serializer_class = PartnerSerializer
    permission_classes = [IsAuthenticated]

    # ordering=partner_name などを許可
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