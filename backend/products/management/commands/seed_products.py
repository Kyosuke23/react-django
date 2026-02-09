from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decimal import Decimal

from tenants.models import Tenant
from products.models import Product, ProductCategory

User = get_user_model()


class Command(BaseCommand):
    help = "Seed product categories (10) and products (60)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--tenant-id",
            type=int,
            required=True,
            help="Target tenant ID"
        )

    def handle(self, *args, **options):
        tenant_id = options["tenant_id"]

        # ============
        # 前提データ取得
        # ============
        tenant = Tenant.objects.filter(id=tenant_id).first()
        if not tenant:
            self.stderr.write(self.style.ERROR("指定された Tenant が存在しません"))
            return

        user = User.objects.filter(is_superuser=True).first()
        if not user:
            self.stderr.write(self.style.ERROR("スーパーユーザーが存在しません"))
            return

        self.stdout.write(self.style.WARNING("既存データを削除します"))

        Product.objects.filter(tenant=tenant).delete()
        ProductCategory.objects.filter(tenant=tenant).delete()

        # ============
        # 商品カテゴリ（10件）
        # ============
        categories = []
        for i in range(1, 11):
            category = ProductCategory.objects.create(
                tenant=tenant,
                product_category_name=f"カテゴリ{i}",
                create_user=user,
                update_user=user,
            )
            categories.append(category)
            self.stdout.write(self.style.SUCCESS(f"Created Category: {category.product_category_name}"))

        # ============
        # 商品（60件）
        # ============
        for i in range(1, 61):
            category = categories[(i - 1) % len(categories)]

            product = Product.objects.create(
                tenant=tenant,
                product_name=f"商品{i}",
                product_category=category,
                unit="個",
                unit_price=Decimal(1000 + i * 10),
                description=f"サンプル商品{i}",
                create_user=user,
                update_user=user,
            )

            self.stdout.write(self.style.SUCCESS(f"Created Product: {product.product_name}"))

        self.stdout.write(
            self.style.SUCCESS(
                "Seed completed: 10 categories / 60 products created."
            )
        )