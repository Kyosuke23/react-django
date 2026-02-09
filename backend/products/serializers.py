from rest_framework import serializers
from .models import Product, ProductCategory


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = [
            "id",
            "product_category_name",
            "is_deleted",
            "created_at",
            "updated_at",
        ]


class ProductSerializer(serializers.ModelSerializer):
    # 一覧表示でのカテゴリ名表示のためread-onlyで付与
    product_category_name = serializers.CharField(
        source="product_category.product_category_name",
        read_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "product_code",
            "product_name",
            "product_name_kana",
            "product_category",
            "product_category_name",
            "unit_price",
            "tax_rate",
            "remarks",
            "is_deleted",
            "created_at",
            "updated_at",
        ]