import { test, expect } from '@playwright/test';

test.describe('AI Ebook Studio Full End-to-End Workflow', () => {
  test('Complete journey: Dashboard -> Idea Generator -> New Book -> Blueprint -> Chapter Generation -> Manuscript -> Export', async ({ page }) => {
    // 1. Visit Dashboard
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome to AI Ebook Studio' })).toBeVisible();

    // 2. Open Idea Generator
    await page.getByRole('button', { name: 'Idea Generator' }).first().click();
    await expect(page.getByRole('heading', { name: 'AI Book Idea Generator' })).toBeVisible();

    // 3. Generate concepts
    await page.getByRole('button', { name: 'Generate Book Concepts' }).click();
    await expect(page.getByText('Concept 1')).toBeVisible({ timeout: 15000 });

    // 4. Click "Use This Idea"
    await page.getByRole('button', { name: 'Use This Idea' }).first().click();

    // 5. Book Wizard modal is now open with filled details
    await expect(page.getByRole('heading', { name: 'Create New Book Project' })).toBeVisible();
    await page.getByRole('button', { name: 'Create Book Project' }).click();

    // 6. Guided Studio should now open with chapters tab
    await expect(page.getByRole('heading', { name: 'Interactive Chapter Outline' })).toBeVisible({ timeout: 15000 });

    // 7. Check Blueprint tab
    await page.getByRole('button', { name: '2. Blueprint' }).click();
    await expect(page.getByRole('heading', { name: 'Book Blueprint Architecture' })).toBeVisible();
    await page.getByRole('button', { name: 'Generate Blueprint with AI' }).click();
    await expect(page.getByText('Core Concept')).toBeVisible({ timeout: 15000 });

    // 8. Approve Blueprint & Create Outline
    await page.getByRole('button', { name: 'Approve & Create Outline' }).click();
    await expect(page.getByRole('heading', { name: 'Interactive Chapter Outline' })).toBeVisible({ timeout: 15000 });

    // 9. Generate Chapter 1 content
    await page.getByRole('button', { name: 'Generate AI' }).first().click();
    await expect(page.getByRole('button', { name: 'Regenerate' }).first()).toBeVisible({ timeout: 20000 });

    // 10. Open Chapter 1 in Manuscript Editor
    await page.getByRole('button', { name: 'Write' }).first().click();
    await expect(page.locator('#manuscript-textarea')).toBeVisible();
    const content = await page.locator('#manuscript-textarea').inputValue();
    expect(content.length).toBeGreaterThan(100);

    // 11. Navigate to Review tab and run consistency audit
    await page.getByRole('button', { name: '5. Review' }).click();
    await expect(page.getByRole('heading', { name: 'Book Consistency & Quality Auditor' })).toBeVisible();
    await page.getByRole('button', { name: 'Audit Entire Manuscript' }).click();
    await expect(page.getByText('Coherence Score')).toBeVisible({ timeout: 15000 });

    // 12. Navigate to Export tab and build DOCX
    await page.getByRole('button', { name: '7. Export' }).click();
    await expect(page.getByRole('heading', { name: 'Microsoft Word (.DOCX)' })).toBeVisible();
    await page.getByRole('button', { name: 'Generate DOCX' }).click();
    await expect(page.getByRole('link', { name: /Download DOCX/i })).toBeVisible({ timeout: 20000 });
  });
});
