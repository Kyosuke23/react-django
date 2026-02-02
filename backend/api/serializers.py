from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


class EmailTokenObtainSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        User = get_user_model()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(_("メールアドレスまたはパスワードが違います。"), code="authorization")

        # username を使って Django の認証基盤に乗せる
        user = authenticate(username=user.get_username(), password=password)
        if not user:
            raise serializers.ValidationError(_("メールアドレスまたはパスワードが違います。"), code="authorization")

        attrs["user"] = user
        return attrs