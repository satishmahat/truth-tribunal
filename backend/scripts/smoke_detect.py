from backend.app import app


def main() -> None:
    client = app.test_client()
    r = client.post('/api/detect', json={'text': 'Breaking: New policy announced by the government today.'})
    print('detect status:', r.status_code)
    print('detect body:', r.json)

    r2 = client.post('/api/detect/report', json={'text': 'Breaking: New policy announced by the government today.'})
    print('report status:', r2.status_code)
    print('report keys:', list(r2.json.keys()) if isinstance(r2.json, dict) else None)


if __name__ == '__main__':
    main()


