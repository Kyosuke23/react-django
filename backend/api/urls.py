from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import health, me, EmailTokenObtainPairView

urlpatterns = [
    path("health/", health),

    # JWT
    path("auth/login/", EmailTokenObtainPairView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),

    # 認証確認用
    path("me/", me),
]