import os

def test_full_ai_and_export_slice(client):
    # 1. Generate Ideas
    idea_res = client.post("/api/blueprints/ideas", json={
        "niche": "Artificial Intelligence for Authors",
        "genre": "Nonfiction",
        "target_audience": "Writers",
        "keywords": "ebook, prompt engineering",
        "count": 2
    })
    assert idea_res.status_code == 200
    ideas_data = idea_res.json()
    assert len(ideas_data["ideas"]) >= 1

    selected_idea = ideas_data["ideas"][0]

    # 2. Create Book using selected idea
    book_res = client.post("/api/books", json={
        "title": selected_idea["title"],
        "subtitle": selected_idea["subtitle"],
        "author": "Jane Author",
        "genre": "Artificial Intelligence",
        "target_audience": selected_idea["target_audience"],
        "reader_promise": selected_idea["reader_promise"],
        "target_chapter_count": 3,
        "target_word_count": 6000
    })
    assert book_res.status_code == 201
    book_id = book_res.json()["id"]

    # 3. Generate Blueprint
    bp_res = client.post(f"/api/blueprints/generate/{book_id}")
    assert bp_res.status_code == 200
    bp_data = bp_res.json()
    assert len(bp_data["proposed_structure"]) == 3

    # 4. Apply Blueprint to Outline
    apply_res = client.post(f"/api/blueprints/apply-to-outline/{book_id}")
    assert apply_res.status_code == 200

    # 5. Get Chapters
    chap_res = client.get(f"/api/chapters/by-book/{book_id}")
    assert chap_res.status_code == 200
    chapters = chap_res.json()
    assert len(chapters) == 3
    ch1_id = chapters[0]["id"]

    # 6. Generate Chapter 1 Content via AI
    gen_ch_res = client.post(f"/api/chapters/{ch1_id}/generate", json={
        "mode": "full",
        "writing_instructions": "Include actionable frameworks"
    })
    assert gen_ch_res.status_code == 200
    ch1_data = gen_ch_res.json()
    assert ch1_data["word_count"] > 100
    assert len(ch1_data["revisions"]) >= 1

    # 7. AI Editing Tool (Proofreading)
    edit_res = client.post("/api/assistant/edit", json={
        "action": "proofread",
        "full_content": ch1_data["content"]
    })
    assert edit_res.status_code == 200
    assert "modified_text" in edit_res.json()

    # 8. Consistency Review
    con_res = client.post(f"/api/assistant/consistency/{book_id}")
    assert con_res.status_code == 200
    assert con_res.json()["overall_score"] >= 80

    # 9. Test DOCX Export
    docx_res = client.post(f"/api/exports/{book_id}/build/docx")
    assert docx_res.status_code == 200
    docx_data = docx_res.json()
    assert docx_data["filename"].endswith(".docx")
    assert docx_data["file_size_kb"] > 0

    # 10. Test PDF Export
    pdf_res = client.post(f"/api/exports/{book_id}/build/pdf")
    assert pdf_res.status_code == 200
    pdf_data = pdf_res.json()
    assert pdf_data["filename"].endswith(".pdf")
    assert pdf_data["file_size_kb"] > 0

    # 11. Test EPUB Export
    epub_res = client.post(f"/api/exports/{book_id}/build/epub")
    assert epub_res.status_code == 200
    epub_data = epub_res.json()
    assert epub_data["filename"].endswith(".epub")
    assert epub_data["file_size_kb"] > 0

    # 12. Test Safe Download of DOCX
    dl_res = client.get(f"/api/exports/download/{docx_data['filename']}")
    assert dl_res.status_code == 200
    assert len(dl_res.content) > 100

