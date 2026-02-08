from rest_framework import serializers
from .models import Partner

class PartnerSerializer(serializers.ModelSerializer):
    tenant_code = serializers.CharField(source="tenant.tenant_code", read_only=True)
    tenant_name = serializers.CharField(source="tenant.tenant_name", read_only=True)

    class Meta:
        model = Partner
        fields = [
            "id",
            "partner_name",
            "partner_name_kana",
            "partner_type",
            "contact_name",
            "tel_number",
            "email",
            "postal_code",
            "state",
            "city",
            "address",
            "address2",
            "is_deleted",
            "created_at",
            "create_user",
            "updated_at",
            "update_user",
            "tenant_code",
            "tenant_name",
        ]
        read_only_fields = ["id", "tenant_code", "tenant_name", "is_deleted", "created_at", "updated_at"]