import React, { useMemo } from 'react';
import { Box, Button, Skeleton, Tooltip, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { brandPalette as p } from '../../constants/brandPalette';
import { groupProductsByCategory } from '../../utils/productCategory';

const FONT = '"Assistant", "Heebo", "Roboto", sans-serif';
const BAR = 14; // <= 24px thick; 4px rounded data-end, square at the baseline
const pct = (share) => `${Math.round(share * 100)}%`;

function Card({ children, subtitle }) {
  return (
    <Box sx={{ bgcolor: p.white, border: `1px solid ${p.border}`, borderRadius: '18px', boxShadow: '0 4px 16px rgba(94, 20, 40, 0.05)', p: { xs: 2, md: 2.5 } }}>
      {subtitle && (
        <Typography sx={{ fontFamily: FONT, fontSize: 14, color: p.muted, mb: 1.5 }}>{subtitle}</Typography>
      )}
      {children}
    </Box>
  );
}

function BarRow({ group, max }) {
  const productsText = group.count === 1 ? 'מוצר אחד' : `${group.count} מוצרים`;
  const detail = group.kind === 'more' ? ` · ${group.categories} קטגוריות` : '';
  const description = `${group.label}: ${productsText} (${pct(group.share)})${detail}`;
  return (
    <Tooltip title={`${productsText} · ${pct(group.share)}${detail}`} placement="top" arrow>
      <Box
        component="li"
        tabIndex={0}
        aria-label={description}
        sx={{
          display: 'grid',
          // Phones: name above its bar, so long (custom) category names are not cut off.
          gridTemplateColumns: { xs: '1fr', sm: 'minmax(120px, 30%) 1fr' },
          alignItems: 'center',
          columnGap: 1.5,
          rowGap: 0.25,
          minHeight: 36,
          px: 1,
          py: { xs: 0.75, sm: 0 },
          borderRadius: '10px',
          cursor: 'default',
          outline: 'none',
          '&:hover, &:focus-visible': { bgcolor: p.blushSoft },
          '&:focus-visible': { boxShadow: `0 0 0 2px ${p.burgundy}` },
        }}
      >
        <Typography
          aria-hidden
          title={group.label}
          sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: group.kind === 'none' ? p.muted : p.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', sm: 'nowrap' } }}
        >
          {group.label}
        </Typography>
        {/* Bar grows from the right baseline (RTL); the count sits at its tip. */}
        <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Box sx={{ flex: '0 1 calc(100% - 3.5ch)', minWidth: 0 }}>
            <Box
              sx={{
                width: `${(group.count / max) * 100}%`,
                minWidth: 4,
                height: BAR,
                borderRadius: '4px 0 0 4px', // rounded data-end (left in RTL), square baseline
                bgcolor: group.kind === 'none' ? p.chartNeutral : p.chartAccent,
              }}
            />
          </Box>
          <Typography sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: p.ink, flexShrink: 0 }}>
            {group.count}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

/**
 * Products by category, from the real products list only (no sample data).
 * Ranked horizontal bars in one hue; "ללא קטגוריה" in a neutral tone, always last and labelled.
 * The list itself is the accessible view: every row states category, count and share.
 */
export default function CategoryChart({ products, status, onRetry }) {
  const { total, groups } = useMemo(() => groupProductsByCategory(products), [products]);

  if (status === 'loading') {
    return (
      <Card>
        {[70, 45, 25].map((w) => (
          <Box key={w} sx={{ display: 'grid', gridTemplateColumns: '30% 1fr', gap: 1.5, alignItems: 'center', minHeight: 36, px: 1 }}>
            <Skeleton width="70%" />
            <Skeleton variant="rounded" width={`${w}%`} height={BAR} />
          </Box>
        ))}
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography sx={{ fontFamily: FONT, fontSize: 15, color: p.ink }}>לא ניתן לטעון את המוצרים כרגע.</Typography>
          {onRetry && <Button size="small" onClick={onRetry} sx={{ color: p.burgundy, fontWeight: 700 }}>נסו שוב</Button>}
        </Box>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography sx={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: p.ink }}>עדיין אין מוצרים</Typography>
          <Typography sx={{ fontFamily: FONT, fontSize: 14, color: p.muted, mt: 0.5, mb: 2 }}>
            כשיתווספו מוצרים, כאן תופיע החלוקה שלהם לקטגוריות.
          </Typography>
          <Button component={RouterLink} to="/products" variant="outlined" sx={{ minHeight: 44, borderColor: p.burgundy, color: p.burgundy, fontWeight: 700, borderRadius: '12px' }}>
            למסך המוצרים
          </Button>
        </Box>
      </Card>
    );
  }

  const max = Math.max(...groups.map((g) => g.count));
  return (
    <Card subtitle={total === 1 ? 'מוצר אחד בסך הכול' : `${total} מוצרים בסך הכול`}>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: 720 }}>
        {groups.map((g) => <BarRow key={g.key} group={g} max={max} />)}
      </Box>
    </Card>
  );
}
