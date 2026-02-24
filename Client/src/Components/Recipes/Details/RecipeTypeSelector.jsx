import React from "react";

export default function RecipeTypeSelector({ recipeType, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: -16 }}>
      <label style={{ fontWeight: 600, color: '#7B5B4B', minWidth: 80 }}>סוג מתכון:</label>
      <select
        value={recipeType}
        onChange={e => onChange(Number(e.target.value))}
        style={{ fontSize: 16, padding: '6px 12px', borderRadius: 8, border: '1px solid #D4A574', background: '#fff7f2', color: '#7B5B4B', fontWeight: 500 }}
      >
        <option value={2}>פרווה</option>
        <option value={0}>חלבי</option>
        <option value={1}>בשרי</option>
      </select>
    </div>
  );
}
