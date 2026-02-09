from rest_framework import serializers
from .models import Product, ProductCategory


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = [
            "id",
            "product_category_name",
            "sort",
            "is_deleted",
            "created_at",
            "updated_at",
        ]


class ProductSerializer(serializers.ModelSerializer):
    product_category_name = serializers.CharField(
        source="product_category.product_category_name",
        read_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "product_name",
            "product_category",
            "product_category_name",
            "unit",
            "unit_price",
            "description",
            "is_deleted",
            "created_at",
            "updated_at",
        ]