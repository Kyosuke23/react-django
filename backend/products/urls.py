from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, ProductCategoryViewSet

router = DefaultRouter()
router.register("", ProductViewSet, basename="products")
router.register("categories", ProductCategoryViewSet, basename="product-categories")

urlpatterns = [
    path("", include(router.urls)),
]