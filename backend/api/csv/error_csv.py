import csv
from io import StringIO
from datetime import datetime
from django.http import HttpResponse

def error_csv_response(headers, error_rows, filename_prefix):
    sio = StringIO()
    writer = csv.writer(sio)

    writer.writerow(["行番号", *headers, "エラー内容"])

    for er in error_rows:
        row = er.get("row") or {}
        writer.writerow([
            er.get("rowno", ""),
            *(row.get(h) or "" for h in headers),
            " / ".join(er.get("errors") or []),
        ])

    body = ("\ufeff" + sio.getvalue()).encode("utf-8")
    resp = HttpResponse(body, content_type="text/csv; charset=utf-8")
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    resp["Content-Disposition"] = f'attachment; filename="{filename_prefix}_{ts}.csv"'
    return resp