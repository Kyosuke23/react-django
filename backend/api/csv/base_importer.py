from abc import ABC, abstractmethod
from django.http import HttpResponse

class BaseCsvImporter(ABC):
    def __init__(self, *, user):
        self.user = user
        self.tenant = getattr(user, "tenant", None)

    def run(self, file):
        rows = self.read_csv(file)

        error_rows = []
        ok_rows = []

        for rowno, row in rows:
            errors, validated = self.validate_row(rowno, row)
            if errors:
                error_rows.append({
                    "rowno": rowno,
                    "row": row,
                    "errors": errors,
                })
            else:
                ok_rows.append(validated)

        if error_rows:
            return self.error_response(error_rows)

        return self.save(ok_rows)

    @abstractmethod
    def read_csv(self, file):
        pass

    @abstractmethod
    def validate_row(self, rowno: int, row: dict):
        """return (errors: list[str], validated_data: dict | None)"""
        pass

    @abstractmethod
    def save(self, validated_rows: list[dict]):
        pass

    @abstractmethod
    def error_response(self, error_rows) -> HttpResponse:
        pass