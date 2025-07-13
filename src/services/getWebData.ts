import { JSDOM } from "jsdom";


interface ContentSection {
    type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote' | 'table';
    content: string;
    level?: number;
}

export async function extractTextFromUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const unwantedElements = [
            'script', 'style', 'noscript', 'iframe', 'object', 'embed',
            'form', 'input', 'button', 'select', 'textarea', 'option',
            'canvas', 'svg', 'audio', 'video', 'source', 'track',
            'map', 'area', 'base', 'link', 'meta', 'title'
        ];

        unwantedElements.forEach(tagName => {
            const elements = document.querySelectorAll(tagName);
            elements.forEach(element => element.remove());
        });

        const unwantedSelectors = [
            '[class*="nav"]', '[class*="menu"]', '[class*="sidebar"]',
            '[class*="footer"]', '[class*="header"]', '[class*="advertisement"]',
            '[class*="ads"]', '[class*="popup"]', '[class*="modal"]',
            '[class*="cookie"]', '[class*="banner"]', '[class*="social"]',
            '[class*="share"]', '[class*="comment"]', '[class*="discussion"]',
            '[class*="related"]', '[class*="recommended"]', '[class*="sponsored"]',
            '[id*="nav"]', '[id*="menu"]', '[id*="sidebar"]',
            '[id*="footer"]', '[id*="header"]', '[id*="ad"]',
            '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
            '[role="complementary"]', '.sr-only', '.visually-hidden'
        ];

        unwantedSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => element.remove());
            } catch (e) {
                // Skip invalid selectors
            }
        });

        // Extract structured content
        const sections = extractStructuredContent(document, dom.window.HTMLElement);

        // Convert to markdown-like format
        return sectionsToMarkdown(sections);

    } catch (error) {
        console.error("Error extracting text from URL:", error);
        throw error;
    }
}

function extractStructuredContent(document: Document, HTMLElementCtor: typeof HTMLElement): ContentSection[] {
    const sections: ContentSection[] = [];

    // Find main content area
    const contentSelectors = [
        'main', 'article', '[role="main"]', '.content', '.main-content',
        '.post-content', '.entry-content', '.article-content', '.page-content',
        '.markdown-body', '.readme', '.documentation', '.docs'
    ];

    let contentRoot: Element | null = null;

    for (const selector of contentSelectors) {
        try {
            const element = document.querySelector(selector);
            if (element && element.textContent && element.textContent.trim().length > 100) {
                contentRoot = element;
                break;
            }
        } catch (e) {
            // Skip invalid selectors
        }
    }

    if (!contentRoot) {
        contentRoot = document.body;
    }

    // Extract content in order
    const walker = document.createTreeWalker(
        contentRoot,
        1, // NodeFilter.SHOW_ELEMENT
        {
            acceptNode: (node) => {
                const element = node as Element;

                if (
                    (element instanceof HTMLElementCtor &&
                        (element.style.display === 'none' || element.style.visibility === 'hidden'))
                ) {
                    return 2;
                }

                return 1;
            }
        }
    );

    let node: Node | null;
    while ((node = walker.nextNode())) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent?.trim() || '';

        if (text.length < 5) continue;

        if (hasSignificantChildElements(element)) continue;

        switch (tagName) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                sections.push({
                    type: 'heading',
                    content: text,
                    level: parseInt(tagName.charAt(1))
                });
                break;

            case 'p':
                if (text.length > 10) {
                    sections.push({
                        type: 'paragraph',
                        content: text
                    });
                }
                break;

            case 'ul':
            case 'ol':
                const listItems = Array.from(element.querySelectorAll('li'))
                    .map(li => li.textContent?.trim() || '')
                    .filter(item => item.length > 0);

                if (listItems.length > 0) {
                    sections.push({
                        type: 'list',
                        content: listItems.join('\n')
                    });
                }
                break;

            case 'blockquote':
                if (text.length > 10) {
                    sections.push({
                        type: 'quote',
                        content: text
                    });
                }
                break;

            case 'pre':
            case 'code':
                if (text.length > 5 && !containsJavaScript(text)) {
                    sections.push({
                        type: 'code',
                        content: text
                    });
                }
                break;

            case 'table':
                const tableText = extractTableText(element);
                if (tableText.length > 10) {
                    sections.push({
                        type: 'table',
                        content: tableText
                    });
                }
                break;

            case 'div':
            case 'section':
            case 'span':
                if (!hasSignificantChildElements(element) && text.length > 20) {
                    sections.push({
                        type: 'paragraph',
                        content: text
                    });
                }
                break;
        }
    }

    return sections;
}

function hasSignificantChildElements(element: Element): boolean {
    const significantTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'blockquote', 'pre', 'table', 'div', 'section'];
    return significantTags.some(tag => element.querySelector(tag) !== null);
}

function containsJavaScript(text: string): boolean {
    const jsPatterns = [
        /function\s*\(/,
        /\b(var|let|const|if|else|for|while|return|document\.|window\.|console\.)/,
        /\{[^}]*\}/,
        /\([^)]*\)\s*=>/,
        /\$\(/,
        /addEventListener/,
        /getElementById/
    ];

    return jsPatterns.some(pattern => pattern.test(text));
}

function extractTableText(table: Element): string {
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        return cells.map(cell => cell.textContent?.trim() || '').join(' | ');
    }).join('\n');
}

function sectionsToMarkdown(sections: ContentSection[]): string {
    return sections.map(section => {
        switch (section.type) {
            case 'heading':
                return `${'#'.repeat(section.level || 1)} ${section.content}`;

            case 'paragraph':
                return section.content;

            case 'list':
                return section.content.split('\n').map(item => `• ${item}`).join('\n');

            case 'quote':
                return `> ${section.content}`;

            case 'code':
                return `\`\`\`\n${section.content}\n\`\`\``;

            case 'table':
                return section.content;

            default:
                return section.content;
        }
    }).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}