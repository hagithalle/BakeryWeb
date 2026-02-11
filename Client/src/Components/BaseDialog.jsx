import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from "@mui/material";

/**
 * קומפוננטת דיאלוג בסיסית משותפת לכל הדיאלוגים במערכת
 * 
 * @param {object} props
 * @param {boolean} props.open - האם הדיאלוג פתוח
 * @param {function} props.onClose - פונקציה לסגירת הדיאלוג
 * @param {function} props.onSave - פונקציה לשמירת הנתונים
 * @param {string} props.title - כותרת הדיאלוג
 * @param {React.ReactNode} props.children - תוכן הדיאלוג
 * @param {object} props.strings - מחרוזות תרגום
 * @param {boolean} props.isValid - האם הטופס תקין לשמירה
 * @param {boolean} props.isSaving - האם נמצא בתהליך שמירה
 * @param {string} props.maxWidth - רוחב מקסימלי של הדיאלוג (xs, sm, md, lg, xl)
 * @param {boolean} props.showActions - האם להציג את כפתורי הפעולה (ברירת מחדל: true)
 * @param {string} props.saveLabel - טקסט כפתור השמירה (ברירת מחדל: "שמור")
 * @param {string} props.cancelLabel - טקסט כפתור הביטול (ברירת מחדל: "ביטול")
 * @param {boolean} props.disableEnforceFocus - ביטול אכיפת פוקוס
 * @param {boolean} props.disableRestoreFocus - ביטול שחזור פוקוס
 * @param {object} props.sx - עיצוב נוסף
 */
export default function BaseDialog({
  open,
  onClose,
  onSave,
  title,
  children,
  strings = {},
  isValid = true,
  isSaving = false,
  maxWidth = "sm",
  showActions = true,
  saveLabel,
  cancelLabel,
  disableEnforceFocus,
  disableRestoreFocus,
  sx = {}
}) {
  const handleSave = async () => {
    if (isValid && onSave) {
      await onSave();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      dir={strings.direction || "rtl"}
      disableEnforceFocus={disableEnforceFocus}
      disableRestoreFocus={disableRestoreFocus}
      sx={sx}
    >
      <DialogTitle
        sx={{
          color: '#7B5B4B',
          fontWeight: 700,
          fontSize: 26,
          textAlign: 'center',
          pb: 1,
          pt: 2
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent
        sx={{
          bgcolor: '#FFF7F2',
          borderRadius: 3,
          p: 3,
          pt: 2
        }}
      >
        {children}
      </DialogContent>
      {showActions && (
        <DialogActions
          sx={{
            bgcolor: '#FFF7F2',
            px: 3,
            pb: 2,
            gap: 1
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              color: '#7B5B4B',
              borderColor: '#7B5B4B',
              '&:hover': {
                borderColor: '#5d453a',
                backgroundColor: 'rgba(123, 91, 75, 0.04)'
              }
            }}
            variant="outlined"
          >
            {cancelLabel || strings.product?.cancel || "ביטול"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            variant="contained"
            sx={{
              backgroundColor: '#C98929',
              color: 'white',
              '&:hover': {
                backgroundColor: '#b07623'
              },
              '&:disabled': {
                backgroundColor: '#e0e0e0',
                color: '#9e9e9e'
              }
            }}
          >
            {isSaving ? "שומר..." : (saveLabel || strings.product?.save || "שמור")}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
