from __future__ import annotations

import csv
from django.conf import settings
from django.db import models
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from io import StringIO
from rest_framework.response import Response
from typing import Any, Iterable
from django.http import HttpResponse
from django.db import transaction, IntegrityError

class BaseModel(models.Model):
    '''
    モデルの基底クラス
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


@dataclass
class RowError:
    rowno: int
    row: dict[str, Any]
    errors: list[str]


class BaseCsvImporter(ABC):
    """
    CSVインポート処理の規定クラス
    - 1つでもエラーがあれば保存しない
    - エラーがあれば「エラー行だけ」をCSVで返す（200 text/csv）
    - 全行OKなら atomic で保存
    """

    csv_headers: list[str] = []
    error_col_name: str = "エラー内容"
    rowno_col_name: str = "行番号"

    def __init__(self, *, request, file):
        self.request = request
        self.file = file
        self._fieldnames: list[str] = []  # DictReader.fieldnames を保持

    def run(self) -> HttpResponse:
        rows = list(self._read_csv_dict_rows())

        # rowsではなく fieldnames で検証する（0件でも検証可）
        self._validate_headers(self._fieldnames)

        # ヘッダのみのCSVを許可する
        if not rows:
            return self.success_response(0)

        ok_rows: list[Any] = []
        error_rows: list[RowError] = []

        seen = self.init_seen_state()

        for idx, row in enumerate(rows, start=2):  # header=1
            errs = self.validate_row(rowno=idx, row=row, seen=seen)
            if errs:
                error_rows.append(RowError(rowno=idx, row=row, errors=errs))
                continue
            ok_rows.append(self.build_ok_row(rowno=idx, row=row, seen=seen))

        if error_rows:
            return self.error_csv_response(error_rows, filename=self.error_filename())

        try:
            with transaction.atomic():
                created = self.save_ok_rows(ok_rows)
        except IntegrityError:
            conflict = self.on_integrity_error(ok_rows)
            if not conflict:
                conflict = [
                    RowError(
                        rowno=0,
                        row={},
                        errors=["DB登録時に整合性エラーが発生しました。再度CSV取込を実行してください。"],
                    )
                ]
            return self.error_csv_response(conflict, filename=self.error_filename())

        return self.success_response(created)

    # -----------------------------
    # hooks
    # -----------------------------
    def init_seen_state(self) -> Any:
        return None

    @abstractmethod
    def validate_row(self, *, rowno: int, row: dict[str, Any], seen: Any) -> list[str]:
        raise NotImplementedError

    @abstractmethod
    def build_ok_row(self, *, rowno: int, row: dict[str, Any], seen: Any) -> Any:
        raise NotImplementedError

    @abstractmethod
    def save_ok_rows(self, ok_rows: list[Any]) -> int:
        raise NotImplementedError

    def on_integrity_error(self, ok_rows: list[Any]) -> list[RowError]:
        return []

    # -----------------------------
    # helpers
    # -----------------------------
    def _read_csv_dict_rows(self) -> Iterable[dict[str, Any]]:
        raw = self.file.read().decode("utf-8-sig")
        sio = StringIO(raw)

        reader = csv.DictReader(sio)
        self._fieldnames = [h.strip() for h in (reader.fieldnames or []) if h and h.strip()]

        for row in reader:
            yield {k: (v if v is not None else "") for k, v in row.items()}

    def _validate_headers(self, headers: Iterable[str]) -> None:
        if not self.csv_headers:
            return

        got = {h.strip() for h in headers if h and h.strip()}
        expected = {h.strip() for h in self.csv_headers}

        missing = sorted(expected - got)
        if missing:
            # 区切り文字違いあるある（ヘッダが1列に潰れてカンマを含む等）
            hint = ""
            if len(got) == 1:
                only = next(iter(got))
                if "," in only:
                    hint = "（CSVの区切り文字が想定と違う可能性があります。Excelで保存し直した/区切りがカンマではない等）"
            raise ValueError(f"CSVヘッダが不正です。不足: {', '.join(missing)}{hint}")

    def now_ymdhms(self) -> str:
        return datetime.now().strftime("%Y%m%d%H%M%S")

    def error_file_prefix(self) -> str:
        """
        エラーCSVのファイル名の先頭を返す。
        派生クラス側で上書きして用途別に変更できる。
        """
        return "import_errors"

    def error_filename(self) -> str:
        """
        エラーCSVのファイル名を生成する。
        """
        return f"{self.error_file_prefix()}_{self.now_ymdhms()}.csv"

    def error_csv_response(self, error_rows: list[RowError], filename: str) -> HttpResponse:
        sio = StringIO()
        w = csv.writer(sio)

        w.writerow([self.rowno_col_name, *self.csv_headers, self.error_col_name])

        for er in error_rows:
            row = er.row or {}
            reason = " / ".join([str(x) for x in er.errors])
            w.writerow([er.rowno, *[(row.get(h) or "") for h in self.csv_headers], reason])

        body = ("\ufeff" + sio.getvalue()).encode("utf-8")
        resp = HttpResponse(body, content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp

    def success_response(self, created_count: int) -> HttpResponse:
        return Response({"count": created_count}, status=200)