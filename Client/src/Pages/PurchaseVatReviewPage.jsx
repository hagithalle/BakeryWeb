import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Checkbox,
  Select, MenuItem, Button, Alert, Chip, FormControlLabel, Switch, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getPurchaseVatReview, previewPurchaseVat, applyPurchaseVat } from "../Services/purchaseVatService";
import {
  TREATMENT_OPTIONS, KIND_LABELS, STATE_LABELS, priceUnitLabel, rowKey, treatmentLabel,
  needsDeductibility, effectiveChoice, pendingChanges, incompleteSelections,
} from "../utils/purchaseVat";
import { formatMoneyOrDash } from "../utils/pricingForm";

// בדיקה מרוכזת: לכל פריט – המחיר שהוזן, סוג המע"מ, והעלות בפועל לפני ואחרי. נשמרים רק פריטים שסומנו, אחרי אישור.
export default function PurchaseVatReviewPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["purchaseVatReview"], queryFn: getPurchaseVatReview });

  const [edits, setEdits] = useState({});           // { "kind:id": { treatment, deductible } }
  const [selected, setSelected] = useState(new Set());
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(true);
  const [bulkTreatment, setBulkTreatment] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState(null);

  const vatStatus = data?.vatStatus ?? null;
  const items = useMemo(() => data?.items || [], [data]);
  const visible = useMemo(
    () => items.filter((item) => !onlyUnreviewed || item.state === 1 || item.state === 2 || edits[rowKey(item)]),
    [items, onlyUnreviewed, edits]
  );

  // עלות בפועל לפי הבחירות שבטופס – מחושבת בשרת (לא נשמר דבר)
  const previewRequest = useMemo(() => {
    const list = items
      .filter((item) => edits[rowKey(item)]?.treatment != null)
      .map((item) => ({ kind: item.kind, id: item.id, purchaseVatTreatment: edits[rowKey(item)].treatment,
        inputVatDeductible: needsDeductibility(vatStatus, edits[rowKey(item)].treatment) ? edits[rowKey(item)].deductible : null }));
    return list.length ? JSON.stringify(list) : null;
  }, [items, edits, vatStatus]);
  const [preview, setPreview] = useState({ key: null, byKey: {} });
  useEffect(() => {
    if (!previewRequest) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      previewPurchaseVat(JSON.parse(previewRequest)).then((result) => {
        if (cancelled) return;
        const byKey = {};
        result.items.forEach((x) => { byKey[`${x.kind}:${x.id}`] = x; });
        setPreview({ key: previewRequest, byKey });
      }).catch(() => { if (!cancelled) setPreview({ key: previewRequest, byKey: {}, failed: true }); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [previewRequest]);
  const previewFor = (item) => (preview.key === previewRequest ? preview.byKey[rowKey(item)] : undefined);

  const changes = useMemo(() => pendingChanges(items, edits, selected, vatStatus), [items, edits, selected, vatStatus]);
  const incomplete = useMemo(() => incompleteSelections(items, edits, selected, vatStatus), [items, edits, selected, vatStatus]);
  const previewErrors = changes.filter((c) => previewFor({ kind: c.kind, id: c.id })?.error);
  const previewMissing = changes.some((c) => previewFor({ kind: c.kind, id: c.id }) === undefined);

  const { mutate: save, isPending } = useMutation({
    mutationFn: applyPurchaseVat,
    onSuccess: (result) => {
      queryClient.setQueryData(["purchaseVatReview"], result);
      ["products", "recipes", "ingredients", "packaging"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      setEdits({}); setSelected(new Set()); setConfirmOpen(false);
      setMessage({ severity: "success", text: `נשמרו ${changes.length} פריטים` });
    },
    onError: (error) => { setConfirmOpen(false); setMessage({ severity: "error", text: error?.response?.data?.message || "השמירה נכשלה" }); },
  });

  const setChoice = (item, choice) => {
    setEdits((current) => ({ ...current, [rowKey(item)]: choice }));
    setSelected((current) => new Set(current).add(rowKey(item)));   // a change made on a row selects that row
  };
  const toggle = (item) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(rowKey(item))) next.delete(rowKey(item)); else next.add(rowKey(item));
    return next;
  });
  const applyToSelected = () => {
    const treatment = Number(bulkTreatment);
    setEdits((current) => {
      const next = { ...current };
      items.filter((item) => selected.has(rowKey(item))).forEach((item) => { next[rowKey(item)] = { treatment, deductible: null }; });
      return next;
    });
  };

  if (isLoading) return null;
  if (isError) return <Alert severity="error">לא ניתן לטעון את רשימת הפריטים</Alert>;

  const byKey = Object.fromEntries(items.map((item) => [rowKey(item), item]));

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }} dir="rtl">
      <Typography variant="h5" sx={{ fontWeight: 800, color: "#7B3B1D", mb: 1 }}>בדיקת מע"מ במחירי קנייה</Typography>
      <Typography variant="body2" sx={{ color: "#5D4037", mb: 2 }}>
        לכל פריט מופיעים המחיר שהוזן והעלות בפועל לעסק. שום דבר לא משתנה עד שמסמנים פריטים ומאשרים את השמירה.
        פריטים שלא נבדקו ממשיכים להיחשב לפי המחיר כפי שהוזן.
      </Typography>

      {vatStatus == null && (
        <Alert severity="warning" sx={{ mb: 2 }}>לא נבחר סטטוס מע"מ לעסק (בעמוד ניהול עלויות). עד אז המחירים משמשים כפי שהוזנו.</Alert>
      )}
      <Alert severity={data.unreviewedCount ? "info" : "success"} sx={{ mb: 2 }}>
        {data.unreviewedCount ? `${data.unreviewedCount} פריטים עדיין לא נבדקו.` : "כל הפריטים נבדקו."}
        {vatStatus === 1 && " העסק עוסק פטור: מע\"מ על קניות הוא חלק מהעלות ואינו מקוזז."}
      </Alert>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 1.5 }}>
        <FormControlLabel control={<Switch checked={onlyUnreviewed} onChange={(e) => setOnlyUnreviewed(e.target.checked)} />} label="רק פריטים שלא נבדקו" />
        <Select size="small" displayEmpty value={bulkTreatment} onChange={(e) => setBulkTreatment(e.target.value)} sx={{ minWidth: 220 }}>
          <MenuItem value="">בחירה לכל המסומנים…</MenuItem>
          {TREATMENT_OPTIONS.map((o) => <MenuItem key={o.value} value={String(o.value)}>{o.label}</MenuItem>)}
        </Select>
        <Button variant="outlined" disabled={!bulkTreatment || selected.size === 0} onClick={applyToSelected}>
          החל על {selected.size} מסומנים (בטופס בלבד)
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell align="right">סוג</TableCell>
              <TableCell align="right">שם</TableCell>
              <TableCell align="right">מחיר שהוזן</TableCell>
              <TableCell align="right">מע"מ במחיר</TableCell>
              {vatStatus === 2 && <TableCell align="right">מוכר לקיזוז</TableCell>}
              <TableCell align="right">עלות בפועל</TableCell>
              <TableCell align="right">מצב</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((item) => {
              const choice = effectiveChoice(item, edits);
              const edited = !!edits[rowKey(item)];
              const p = edited ? previewFor(item) : null;
              const after = edited ? p?.effectivePrice : item.effectivePrice;
              return (
                <TableRow key={rowKey(item)} selected={selected.has(rowKey(item))}>
                  <TableCell padding="checkbox"><Checkbox checked={selected.has(rowKey(item))} onChange={() => toggle(item)} /></TableCell>
                  <TableCell align="right">{KIND_LABELS[item.kind]}{!item.isActive && " (לא פעילה)"}</TableCell>
                  <TableCell align="right">{item.name}</TableCell>
                  <TableCell align="right">{formatMoneyOrDash(item.enteredPrice)} {priceUnitLabel(item)}</TableCell>
                  <TableCell align="right">
                    <Select size="small" displayEmpty value={choice.treatment ?? ""} sx={{ minWidth: 170 }}
                      onChange={(e) => setChoice(item, { treatment: e.target.value === "" ? null : Number(e.target.value), deductible: null })}>
                      <MenuItem value="">לא נבדק</MenuItem>
                      {TREATMENT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                    </Select>
                  </TableCell>
                  {vatStatus === 2 && (
                    <TableCell align="right">
                      {needsDeductibility(vatStatus, choice.treatment) ? (
                        <Select size="small" displayEmpty value={choice.deductible === null ? "" : String(choice.deductible)}
                          onChange={(e) => setChoice(item, { ...choice, deductible: e.target.value === "" ? null : e.target.value === "true" })}>
                          <MenuItem value="">לא צוין</MenuItem>
                          <MenuItem value="true">כן</MenuItem>
                          <MenuItem value="false">לא</MenuItem>
                        </Select>
                      ) : "—"}
                    </TableCell>
                  )}
                  <TableCell align="right">
                    {edited && after !== undefined && after !== item.effectivePrice
                      ? <span>{formatMoneyOrDash(item.effectivePrice)} ← <strong>{formatMoneyOrDash(after)}</strong></span>
                      : formatMoneyOrDash(edited && after === undefined ? null : after)}
                    {p?.error && <Typography variant="caption" sx={{ display: "block", color: "#C62828" }}>{p.error}</Typography>}
                  </TableCell>
                  <TableCell align="right">
                    <Chip size="small" label={STATE_LABELS[item.state]} color={item.state === 0 ? "success" : "warning"} variant="outlined" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {incomplete.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {incomplete.length} פריטים מסומנים עדיין בלי תשובה מלאה – יש לבחור סוג מע"מ{vatStatus === 2 ? " ואם הוא מוכר לקיזוז" : ""}, או להסיר את הסימון.
        </Alert>
      )}
      <Button variant="contained" disabled={changes.length === 0 || incomplete.length > 0 || previewErrors.length > 0 || previewMissing || isPending}
        onClick={() => { setMessage(null); setConfirmOpen(true); }} sx={{ bgcolor: "#C98929", "&:hover": { bgcolor: "#A87020" } }}>
        שמירת {changes.length} פריטים מסומנים…
      </Button>
      {message && <Alert severity={message.severity} sx={{ mt: 2 }}>{message.text}</Alert>}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} dir="rtl" maxWidth="sm" fullWidth>
        <DialogTitle>לאשר שמירה של {changes.length} פריטים?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>המחירים שהוזנו לא משתנים. משתנה רק אופן החישוב של העלות בפועל:</Typography>
          {changes.map((change) => {
            const item = byKey[`${change.kind}:${change.id}`];
            const after = previewFor(item)?.effectivePrice;
            return (
              <Typography key={`${change.kind}:${change.id}`} variant="body2">
                • {KIND_LABELS[item.kind]} "{item.name}": {treatmentLabel(change.purchaseVatTreatment)}
                {change.inputVatDeductible != null && (change.inputVatDeductible ? ", מוכר לקיזוז" : ", לא מוכר לקיזוז")}
                {" – "}עלות {formatMoneyOrDash(item.effectivePrice)} ← {formatMoneyOrDash(after)} {priceUnitLabel(item)}
              </Typography>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>ביטול</Button>
          <Button variant="contained" disabled={isPending} onClick={() => save(changes)}>אישור ושמירה</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
