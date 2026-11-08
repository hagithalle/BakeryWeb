import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CategoryChart from './CategoryChart';

const render = (props) => renderToString(<MemoryRouter><CategoryChart {...props} /></MemoryRouter>);
const rows = (html) => [...html.matchAll(/<li[^>]*aria-label="([^"]+)"/g)].map((m) => m[1]);

describe('CategoryChart', () => {
  it('shows an empty state, not a chart, when there are no products', () => {
    const html = render({ products: [], status: 'ready' });
    expect(html).toContain('עדיין אין מוצרים');
    expect(rows(html)).toEqual([]);
  });

  it('shows an error state, never zero bars, when products failed to load', () => {
    const html = render({ products: null, status: 'error', onRetry: () => {} });
    expect(html).toContain('לא ניתן לטעון את המוצרים');
    expect(rows(html)).toEqual([]);
  });

  it('renders one labelled row per real category, with "ללא קטגוריה" last', () => {
    const html = render({
      status: 'ready',
      products: [
        { id: 1, category: 'מארז כללי' }, { id: 2, category: 'מארז כללי' },
        { id: 3, category: 'מארז יום הולדת' }, { id: 4, category: null, recipe: { category: '' } },
      ],
    });
    expect(rows(html)).toEqual([
      'מארז כללי: 2 מוצרים (50%)',
      'מארז יום הולדת: מוצר אחד (25%)',
      'ללא קטגוריה: מוצר אחד (25%)',
    ]);
    expect(html).toContain('4 מוצרים בסך הכול');
  });
});
