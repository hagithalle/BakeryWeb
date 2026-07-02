import React from 'react';
import PageHeader from '../Common/PageHeader';

export default function FixedExpensesHeader({ onAdd }) {
  return (
    <PageHeader
      title="הוצאות קבועות"
      subtitle="ניהול העלויות החודשיות"
      actionLabel="הוצאה חדשה"
      onActionClick={onAdd}
    />
  );
}
