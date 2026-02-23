import React from 'react';
import PageHeader from '../../Components/Common/PageHeader';

export default function FixedExpensesHeader({ onAdd }) {
  return (
    <PageHeader
      title="הוצאות קבועות"
      subtitle="ניהול העלויות החודשיות"
      buttonLabel="הוצאה חדשה"
      onAdd={onAdd}
    />
  );
}
