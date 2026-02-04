from django.conf import settings
from django.db import models


class BaseModel(models.Model):
    '''
    共通基底クラス
    - 論理削除
    - 作成日時 / 更新日時
    - 作成者 / 更新者
    '''
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name="%(class)ss", null=False, blank=False, verbose_name='テナント')
    is_deleted = models.BooleanField(default=False, verbose_name='削除フラグ')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    create_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="%(class)s_creator",
        verbose_name='作成ユーザー'
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')
    update_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="%(class)s_updater",
        verbose_name='更新ユーザー'
    )

    class Meta:
        abstract = True
