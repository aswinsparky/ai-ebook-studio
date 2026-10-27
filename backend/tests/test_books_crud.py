def test_book_crud_lifecycle(client):
    # 1. Create a book
    payload = {
        "title": "Mastering Deep Work",
        "subtitle": "The Ultimate Guide to Extreme Productivity",
        "author": "Dr. Dev",
        "genre": "Productivity",
        "topic": "Focus and Deep Work",
        "target_audience": "Software engineers and knowledge workers",
        "reader_promise": "Reclaim 20 focused hours per week",
        "writing_style": "Concise and actionable",
        "tone": "Authoritative",
        "target_word_count": 20000,
        "target_chapter_count": 5
    }
    create_res = client.post("/api/books", json=payload)
    assert create_res.status_code == 201
    book_data = create_res.json()
    assert book_data["title"] == "Mastering Deep Work"
    book_id = book_data["id"]

    # 2. Get the book
    get_res = client.get(f"/api/books/{book_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == book_id

    # 3. List books
    list_res = client.get("/api/books")
    assert list_res.status_code == 200
    books = list_res.json()
    assert len(books) >= 1
    assert any(b["id"] == book_id for b in books)

    # 4. Update the book
    update_res = client.put(f"/api/books/{book_id}", json={"title": "Mastering Deep Work 2.0"})
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Mastering Deep Work 2.0"

    # 5. Duplicate the book
    dup_res = client.post(f"/api/books/{book_id}/duplicate")
    assert dup_res.status_code == 201
    dup_data = dup_res.json()
    assert "Copy" in dup_data["title"]
    dup_id = dup_data["id"]

    # 6. Delete duplicated book
    del_res = client.delete(f"/api/books/{dup_id}")
    assert del_res.status_code == 204

