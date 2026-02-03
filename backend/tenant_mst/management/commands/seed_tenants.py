from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tenant_mst.models import Tenant
import random

User = get_user_model()

class Command(BaseCommand):
    help = "Seed tenants (create dummy tenant data)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=30,
            help="Number of tenants to create",
        )

    def handle(self, *args, **options):
        count = options["count"]

        user = User.objects.first()
        if not user:
            self.stderr.write(self.style.ERROR("User not found. Create a user first."))
            return

        tenants = []
        for i in range(1, count + 1):
            tenants.append(
                Tenant(
                    tenant_name=f"テスト株式会社{i}",
                    representative_name=f"代表者{i}",
                    email=f"tenant{i}@example.com",
                    tel_number=f"03-1234-{1000 + i}",
                    postal_code="100-0001",
                    state="東京都",
                    city="千代田区",
                    address="テスト町1-1-1",
                    address2=f"{i}F",
                    is_deleted=False,
                    create_user=user,
                    update_user=user,
                )
            )

        Tenant.objects.bulk_create(tenants)

        self.stdout.write(
            self.style.SUCCESS(f"{count} tenants created successfully.")
        )