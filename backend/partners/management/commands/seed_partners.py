from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from tenants.models import Tenant
from partners.models import Partner

User = get_user_model()


class Command(BaseCommand):
    help = "Seed 50 partners for development"

    def handle(self, *args, **options):
        # ============
        # 前提データ取得
        # ============
        tenant = Tenant.objects.first()
        if not tenant:
            self.stderr.write(self.style.ERROR("Tenant が存在しません"))
            return

        user = User.objects.filter(is_superuser=True).first()
        if not user:
            self.stderr.write(self.style.ERROR("スーパーユーザーが存在しません"))
            return

        partner_types = ["customer", "supplier", "both"]

        created_count = 0

        for i in range(1, 51):
            partner_type = partner_types[(i - 1) % len(partner_types)]

            data = {
                "partner_name": f"取引先テスト株式会社{i}",
                "partner_name_kana": f"トリヒキサキテスト{i}",
                "partner_type": partner_type,
                "contact_name": f"担当者{i}",
                "tel_number": f"03-0000-{1000 + i:04d}",
                "email": f"partner{i}@example.com",
                "postal_code": f"{1000000 + i}",
                "state": "東京都",
                "city": "千代田区",
                "address": f"テスト町{i}-1-{i}",
                "address2": f"{i}F",
            }

            obj, created = Partner.objects.get_or_create(
                tenant=tenant,
                partner_name=data["partner_name"],
                email=data["email"],
                defaults={
                    **data,
                    "tenant": tenant,
                    "create_user": user,
                    "update_user": user,
                },
            )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created: {obj.partner_name}"))
            else:
                self.stdout.write(f"Skipped (exists): {obj.partner_name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed completed. Created {created_count} partners (total target: 50)."
            )
        )