import React from "react";
import SoftDialog from "./ui/SoftDialog";

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
  sx = {},
}) {
  const handleSave = async () => {
    if (isValid && onSave) await onSave();
  };

  return (
    <SoftDialog
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title={title}
      maxWidth={maxWidth}
      dir={strings.direction || "rtl"}
      saveLabel={saveLabel || strings.product?.save || "שמור"}
      cancelLabel={cancelLabel || strings.product?.cancel || "ביטול"}
      isValid={isValid}
      isSaving={isSaving}
      showActions={showActions}
      disableEnforceFocus={disableEnforceFocus}
      disableRestoreFocus={disableRestoreFocus}
    >
      {children}
    </SoftDialog>
  );
}
