from rest_framework import serializers
from .models import Tenant

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = [
            "id",
            "tenant_code",
            "tenant_name",
            "representative_name",
            "email",
            "tel_number",
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
        ]
        read_only_fields = ["id", "tenant_code", "is_deleted", "created_at", "create_user", "updated_at", "update_user"]