from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, ProductCategoryViewSet

router = DefaultRouter()
router.register("categories", ProductCategoryViewSet, basename="product-categories")
router.register("", ProductViewSet, basename="products")

urlpatterns = [
    path("", include(router.urls)),
]